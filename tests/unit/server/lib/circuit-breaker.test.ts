import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../../../server/lib/circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let successFn: () => Promise<string>;
  let failFn: () => Promise<string>;

  beforeEach(() => {
    // Reset circuit breaker before each test
    circuitBreaker = new CircuitBreaker(3, 5000); // 3 failures, 5ms timeout

    // Mock functions
    successFn = vi.fn(async () => 'success');
    failFn = vi.fn(async () => {
      throw new Error('Operation failed');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should have zero failure count initially', () => {
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('successful operations', () => {
    it('should execute successful operation', async () => {
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should reset failure count on success', async () => {
      // First fail
      try {
        await circuitBreaker.execute(failFn);
      } catch (error) {
        // Expected to fail
      }

      expect(circuitBreaker.getFailureCount()).toBe(1);

      // Then succeed
      await circuitBreaker.execute(successFn);

      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should remain closed after successful operation', async () => {
      await circuitBreaker.execute(successFn);

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('failed operations', () => {
    it('should throw error on failed operation', async () => {
      await expect(circuitBreaker.execute(failFn)).rejects.toThrow('Operation failed');
      expect(failFn).toHaveBeenCalledTimes(1);
    });

    it('should increment failure count on failure', async () => {
      try {
        await circuitBreaker.execute(failFn);
      } catch (error) {
        // Expected to fail
      }

      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should open circuit after threshold failures', async () => {
      // Fail 3 times (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });
  });

  describe('open circuit behavior', () => {
    it('should reject operations when circuit is open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Try to execute operation
      await expect(circuitBreaker.execute(successFn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(successFn).not.toHaveBeenCalled();
    });

    it('should not call function when circuit is open', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Try to execute operation multiple times
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.execute(successFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(successFn).not.toHaveBeenCalled();
    });
  });

  describe('half-open state', () => {
    it('should transition to half-open after timeout', async () => {
      // Create a circuit breaker with shorter timeout for testing
      const testBreaker = new CircuitBreaker(3, 10); // 10ms timeout

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await testBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(testBreaker.getState()).toBe(CircuitState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Next operation should put it in half-open and then close on success
      await testBreaker.execute(successFn);

      expect(testBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should close circuit on successful operation in half-open', async () => {
      // Create a circuit breaker with shorter timeout for testing
      const testBreaker = new CircuitBreaker(3, 10); // 10ms timeout

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await testBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Successful operation should close circuit
      await testBreaker.execute(successFn);

      expect(testBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(testBreaker.getFailureCount()).toBe(0);
    });

    it('should reopen circuit on failed operation in half-open', async () => {
      // Create a circuit breaker with shorter timeout for testing
      const testBreaker = new CircuitBreaker(3, 10); // 10ms timeout

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await testBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 15));

      // Failed operation should reopen circuit
      try {
        await testBreaker.execute(failFn);
      } catch (error) {
        // Expected to fail
      }

      expect(testBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('reset', () => {
    it('should reset circuit to closed state', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Reset
      circuitBreaker.reset();

      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('should allow operations after reset', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      // Reset
      circuitBreaker.reset();

      // Should now work
      const result = await circuitBreaker.execute(successFn);

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom configuration', () => {
    it('should use custom failure threshold', async () => {
      const customBreaker = new CircuitBreaker(5, 5000); // 5 failures

      // Fail 4 times (below threshold)
      for (let i = 0; i < 4; i++) {
        try {
          await customBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(customBreaker.getFailureCount()).toBe(4);

      // Fail one more time (at threshold)
      try {
        await customBreaker.execute(failFn);
      } catch (error) {
        // Expected to fail
      }

      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should use custom timeout', async () => {
      const customBreaker = new CircuitBreaker(3, 100); // 100ms timeout

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await customBreaker.execute(failFn);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(customBreaker.getState()).toBe(CircuitState.OPEN);

      // Should still be open after 50ms
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(customBreaker.getState()).toBe(CircuitState.OPEN);

      // Should be half-open after 100ms
      await new Promise((resolve) => setTimeout(resolve, 60));
      await customBreaker.execute(successFn);
      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('edge cases', () => {
    it('should handle synchronous errors', async () => {
      const syncFailFn = () => {
        throw new Error('Sync error');
      };

      await expect(circuitBreaker.execute(syncFailFn)).rejects.toThrow('Sync error');
      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should handle non-Error exceptions', async () => {
      const throwStringFn = async () => {
        throw 'String error';
      };

      await expect(circuitBreaker.execute(throwStringFn)).rejects.toThrow('String error');
      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('should handle null/undefined returns', async () => {
      const returnNullFn = async () => null;
      const returnUndefinedFn = async () => undefined;

      expect(await circuitBreaker.execute(returnNullFn)).toBeNull();
      expect(await circuitBreaker.execute(returnUndefinedFn)).toBeUndefined();
    });
  });
});
