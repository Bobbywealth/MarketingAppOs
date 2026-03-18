import { Center, FlexCol, FlexRow, PageContainer, Section } from "./page-layout";

export function VibePageContainerStory() {
  return (
    <PageContainer data-testid="story-page-container">
      <div>Container content</div>
    </PageContainer>
  );
}

export function VibeSectionStory() {
  return (
    <Section variant="default" data-testid="story-section">
      <div>First section item</div>
      <div>Second section item</div>
    </Section>
  );
}

export function VibeFlexRowStory() {
  return (
    <FlexRow justify="between" align="center" data-testid="story-flex-row">
      <span>Left</span>
      <span>Right</span>
    </FlexRow>
  );
}

export function VibeFlexColStory() {
  return (
    <FlexCol gap="tight" data-testid="story-flex-col">
      <span>Top</span>
      <span>Bottom</span>
    </FlexCol>
  );
}

export function VibeCenterStory() {
  return (
    <Center data-testid="story-center">
      <span>Centered</span>
    </Center>
  );
}
