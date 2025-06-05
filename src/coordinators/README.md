# Coordinators in Circles Explorer

This directory contains coordinators that orchestrate data fetching and management across multiple domains in the Circles Explorer application.

## What are Coordinators?

Coordinators are a higher-level abstraction that sit above individual domain repositories. They are responsible for:

1. **Orchestrating data fetching** from multiple domain repositories
2. **Managing data dependencies** between domains
3. **Providing a unified API** for UI components
4. **Optimizing data fetching** by batching requests and caching results

Coordinators follow the Mediator pattern, acting as intermediaries between UI components and domain repositories.

## Available Coordinators

### `useProfilesCoordinator`

Coordinates fetching and managing profile data and bot verdicts.

```tsx
const {
	profiles, // All profiles in the store
	fetchProfile, // Fetch a single profile
	fetchProfiles, // Fetch multiple profiles
	getProfile, // Get a profile from the store
	getBotVerdict, // Get a bot verdict from the store
	isLoading, // Whether profiles are being loaded
	loadProfilesForEvents // Load profiles for all addresses in events
} = useProfilesCoordinator()
```

### `useEventsCoordinator`

Coordinates fetching events data and related profiles.

```tsx
const {
	events, // Processed events
	isEventsLoading, // Whether events are being loaded
	isLoadingMore, // Whether more events are being loaded
	loadMoreEvents, // Load more events
	hasMoreEvents // Whether there are more events to load
} = useEventsCoordinator(address)
```

## Implementation Details

### Profiles Coordinator

The profiles coordinator:

1. Fetches profiles from the profiles repository
2. Fetches bot verdicts from the bots repository
3. Stores profiles and bot verdicts in the profile store
4. Provides methods to access profiles and bot verdicts
5. Extracts addresses from events to prefetch profiles

### Events Coordinator

The events coordinator:

1. Fetches events from the events repository
2. Uses the profiles coordinator to prefetch profiles for all addresses in the events
3. Provides methods to load more events and check if there are more events to load

## Benefits of Using Coordinators

1. **Separation of Concerns**: UI components don't need to know about multiple repositories
2. **Reduced Complexity**: UI components have a simpler API to work with
3. **Optimized Data Fetching**: Coordinators can batch requests and avoid duplicate fetches
4. **Centralized Logic**: Business logic for coordinating data is centralized
5. **Testability**: Coordinators can be tested in isolation

## When to Use Coordinators

Use coordinators when:

1. You need to fetch data from multiple domains
2. You have complex data dependencies between domains
3. You want to optimize data fetching
4. You want to provide a simpler API for UI components

## When Not to Use Coordinators

Don't use coordinators when:

1. You only need data from a single domain
2. You don't have complex data dependencies
3. You need fine-grained control over data fetching

In these cases, use domain repositories directly.
