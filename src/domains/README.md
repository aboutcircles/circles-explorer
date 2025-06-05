# Domain-Driven Design in Circles Explorer

This directory contains the domain-driven design (DDD) implementation for the Circles Explorer application.

## Structure

The application follows a domain-driven design approach with the following structure:

```
src/
├── domains/           # Domain layer with domain-specific logic
│   ├── avatars/       # Avatar domain
│   ├── bots/          # Bot detection domain
│   ├── events/        # Events domain
│   ├── profiles/      # Profiles domain
│   └── tokens/        # Tokens domain
│   └── trust/         # Trust relations domain
├── coordinators/      # Coordinators for orchestrating multiple domains
├── hooks/             # React hooks for UI components
├── pages/             # UI pages
├── shared/            # Shared UI components
└── stores/            # Global state stores
```

## Domain Layer

Each domain contains:

- `types.ts`: Type definitions for the domain
- `adapters.ts`: Adapters for transforming data between different formats
- `repository.ts`: Repository for fetching and managing domain data

## Coordinators

Coordinators orchestrate fetching data from multiple domains and manage the data flow between domains. They are responsible for:

1. Coordinating data fetching from multiple repositories
2. Managing data dependencies between domains
3. Providing a unified API for UI components

### Available Coordinators

- `useProfilesCoordinator`: Coordinates fetching profile data and bot verdicts
- `useEventsCoordinator`: Coordinates fetching events data and related profiles

## Usage Examples

### Using the Profiles Coordinator

```tsx
import { useProfilesCoordinator } from 'coordinators'

function MyComponent() {
  const {
    fetchProfile,
    fetchProfiles,
    getProfile,
    getBotVerdict,
    isLoading
  } = useProfilesCoordinator()

  // Fetch a single profile
  useEffect(() => {
    if (address) {
      void fetchProfile(address)
    }
  }, [address, fetchProfile])

  // Get a profile from the store
  const profile = getProfile(address)

  // Check if an address belongs to a bot
  const botVerdict = getBotVerdict(address)
  const isBot = botVerdict?.is_bot === true

  return (
    // Your component JSX
  )
}
```

### Using the Events Coordinator

```tsx
import { useEventsCoordinator } from 'coordinators'

function MyComponent({ address }) {
	const {
		events,
		isEventsLoading,
		isLoadingMore,
		loadMoreEvents,
		hasMoreEvents
	} = useEventsCoordinator(address)

	// Render events
	return (
		<div>
			{events.map((event) => (
				<EventItem key={event.key} event={event} />
			))}

			{hasMoreEvents && (
				<button onClick={loadMoreEvents} disabled={isLoadingMore}>
					Load More
				</button>
			)}
		</div>
	)
}
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each domain is responsible for its own data and logic
2. **Testability**: Domains and coordinators can be tested in isolation
3. **Maintainability**: Changes to one domain don't affect others
4. **Reusability**: Domains can be reused across different parts of the application
5. **Scalability**: New domains can be added without affecting existing ones
