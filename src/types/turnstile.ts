/**
 * Why a Turnstile challenge could not be presented or completed.
 *
 * This lives outside the component because `<script setup>` cannot carry named
 * exports: importing the type from the .vue file silently resolves to `any`.
 */
export type TurnstileFailure = 'missing-site-key' | 'script-unavailable' | 'challenge-failed'
