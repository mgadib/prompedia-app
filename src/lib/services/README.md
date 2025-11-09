# Services Architecture

This directory contains instance-based services that replace the static `SupabaseService` class.

## Why Instance-Based Services?

1. **Testability**: Easy to mock for unit tests
2. **Dependency Injection**: Can inject different Supabase clients
3. **SOLID Principles**: Follows Dependency Inversion Principle
4. **Flexibility**: Can create multiple instances with different configurations

## Available Services

### PromptService

Handles all prompt-related operations.

```typescript
import { promptService } from '@/lib/services/prompt-service';

// Get prompts
const prompts = await promptService.getPrompts(userId);

// Get public prompts
const publicPrompts = await promptService.getPublicPrompts();

// Get single prompt
const prompt = await promptService.getPrompt(promptId);

// Create prompt
const newPrompt = await promptService.createPrompt(promptData);

// Update prompt
const updated = await promptService.updatePrompt(id, updates);

// Delete prompt
await promptService.deletePrompt(id);
```

### AuthService

Handles authentication and user management.

```typescript
import { authService } from '@/lib/services/auth-service';

// Sign up
await authService.signUp(email, password, username);

// Sign in
await authService.signIn(email, password);

// Sign out
await authService.signOut();

// Get current user
const user = await authService.getCurrentUser();

// Get user profile
const profile = await authService.getUser(userId);
```

## Migration from SupabaseService

### Before (Static Class)
```typescript
import { SupabaseService } from '@/lib/supabase-service';

const prompts = await SupabaseService.getPrompts();
```

### After (Instance-Based)
```typescript
import { promptService } from '@/lib/services/prompt-service';

const prompts = await promptService.getPrompts();
```

## Creating Custom Instances

For testing or special use cases, you can create custom instances:

```typescript
import { PromptService } from '@/lib/services/prompt-service';
import { createClient } from '@supabase/supabase-js';

// Create instance with custom client
const testClient = createClient('test-url', 'test-key');
const testPromptService = new PromptService(testClient);
```

## Backward Compatibility

The old `SupabaseService` static class is still available but marked as `@deprecated`. 
It will be maintained for backward compatibility but new code should use instance-based services.
