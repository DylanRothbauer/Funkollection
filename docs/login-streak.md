# Daily login streak

## Product event and calendar

A daily login is recorded when Firebase Authentication resolves a signed-in user inside the
authenticated application shell. A user with a persisted session receives credit by opening the
app; signing out and back in is not required. Returning to a previously open tab also evaluates the
streak when a new UTC date may have started.

Version one uses UTC calendar days. The browser clock is only used to avoid an unnecessary
visibility-change request. The callable function obtains trusted server time and makes every
eligibility decision. Credit requires successful server contact during the eligible UTC day.

## Data model

Private streak state is stored at:

```text
users/{uid}/streaks/dailyLogin
```

Fields:

- `currentStreak`
- `highestStreak`
- `lastCreditedDate` (`YYYY-MM-DD`, UTC)
- `lastCreditedAt` (server timestamp)
- `streakStartedDate`
- `updatedAt` (server timestamp)
- `timezone` (`UTC`)
- `version`

Clients may read only their own record and cannot write any streak field. Future public profiles or
share cards should use an intentional, minimal public projection rather than exposing this private
document.

## Reset model

The implementation uses reset-on-evaluation. The persisted prior value remains until the next
authenticated evaluation. If one or more complete UTC days were missed, the same atomic transaction
starts the new streak at one and preserves `highestStreak`. No global midnight job is required.

## Atomicity

`recordDailyLogin` derives the UID from callable authentication and runs a Firestore transaction.
The transaction compares the trusted UTC date with `lastCreditedDate`. Same-day retries make no
write. Firestore retries conflicting transactions, so simultaneous tabs or devices can produce at
most one increment.

## Deployment

```powershell
firebase deploy --only functions:recordDailyLogin
firebase deploy --only firestore:rules
```

The function region is `us-central1`, matching the frontend service configuration.

## Safe validation

Pure transition tests inject controlled UTC date keys; production never accepts a date from the
client. For an emulator smoke test:

1. Sign in with an emulator user and invoke `recordDailyLogin`.
2. Invoke it repeatedly and from two tabs; the value must remain one for that day.
3. Unit-test next-day and missed-day transitions with `npm test` in `functions`.
4. Attempt a direct client write to the streak document; rules must reject it.

Do not edit production streak documents or change the machine clock to test date transitions.

## Future extensions

- Streak milestone badges should use `highestStreak` and remain permanently earned.
- Share cards should expose streak metrics only through an opt-in display setting.
- Public profiles should receive a separate visibility-controlled projection.
- User-local days would require a validated IANA timezone, server-side conversion, DST tests, and a
  policy preventing timezone changes from awarding duplicate credit.
