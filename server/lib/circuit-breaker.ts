export enum CircuitState {
  CLOSED, // Normal operation
  OPEN,   // Service is failing, stop calling it
  HALF_OPEN // Testing if service is back up
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;

  constructor(failureThreshold: number = 5, resetTimeout: number = 30000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      const timeSinceFailure = this.lastFailureTime ? Date.now() - this.lastFailureTime : 0;
      const timeUntilReset = this.resetTimeout - timeSinceFailure;
      
      console.log(`🔌 Circuit breaker is OPEN. Time until reset: ${Math.ceil(timeUntilReset / 1000)}s`);
      
      if (this.lastFailureTime && timeSinceFailure > this.resetTimeout) {
        console.log(`🔌 Circuit breaker transitioning to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker is OPEN. Service unavailable.");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.lastFailureTime = null;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.log(`❌ Circuit breaker failure count: ${this.failureCount}/${this.failureThreshold}`);
    
    if (this.failureCount >= this.failureThreshold) {
      console.log(`🔌 Circuit breaker OPENED after ${this.failureCount} failures`);
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

