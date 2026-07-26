# Learn Quran through AI — Rollout and Validation

## Product boundary

This is a separate Quran learning experience. The existing vocabulary-based
Learn Quran feature remains available and unchanged.

The Al-Fatihah pilot now performs real server-side Quran speech recognition
and word-transcript matching. It does not evaluate Tajweed, makhraj, vowel
quality, or teacher-level recitation accuracy. It fails closed instead of
generating synthetic scores when the model is unavailable.

## Implemented first release

- Dedicated Learn Quran through AI entry in the Quran dashboard
- Learner-level selection and learning home
- Three clearly marked draft Qaida lessons
- Al-Fatihah ayah selection
- Microphone recording and authenticated multipart upload
- Full-ayah and focused-word practice modes
- Pinned `tarteel-ai/whisper-base-ar-quran` model and local warm-up command
- Server-side FFmpeg audio decoding and CPU/GPU device selection
- Quranic-orthography normalization and omission-safe sequence alignment
- Green/orange/red feedback from real ASR transcript matching
- Visible “AI heard” transcript and model processing time
- No score or mistake saved when the real model is unavailable
- Local attempt history, progress summary, and mistake aggregation
- Draft Tajweed lesson library
- Draft articulation/makhraj guide
- Protected `POST /api/learn/score` endpoint
- 10 MB upload limit and supported-audio validation
- Server-owned pilot Quran text
- Model/revision/scorer metadata in every real response
- Authentication, alignment, route, and upload contract tests

## Localhost and phone deployment

Install FFmpeg, then run these commands from the repository root:

```powershell
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python.exe backend/scripts/warm_quran_asr.py
cd backend
.venv/Scripts/python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000
```

The local backend configuration enables ASR and preloads the pinned model.
Check readiness from the computer or another device on the same Wi-Fi:

```text
http://192.168.1.35:8000/api/learn/status
```

`frontend/.env` already points `EXPO_PUBLIC_API_BASE_URL` at that LAN address.
If the computer's IP changes, update the value and restart Expo. Windows
Firewall must allow the Python backend on private networks.

The first verified smoke test used Al-Fatihah 1:1 recited by Mishary Alafasy:

- transcript: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ`
- word match: 100%
- CPU inference: 22.6 seconds

As a negative control, the app's Shahadah audio scored against Al-Fatihah 1:1
produced a 9% match because only the shared word `الله` aligned. This confirms
that scores now derive from recognized words rather than recording size.

## Non-negotiable guardrails

1. Synthetic results must never be shown as user recitation scores.
2. Do not label transcript matching as Tajweed correction.
3. Do not publish Qaida, Tajweed, makhraj, or teacher audio content until a
   qualified Quran teacher has approved it.
4. Do not store raw user recordings by default.
5. Canonical Quran text must come from a versioned server-side source.
6. A user ID supplied by the mobile client must never be trusted.
7. Model name, model version, scorer version, and curriculum version must be
   stored with every real attempt.

## Development premium testing

Set `EXPO_PUBLIC_DEV_UNLOCK_PREMIUM=true` in `frontend/.env` while using Expo
Go, a development build, or localhost. The client also requires React Native's
`__DEV__` flag, so a production bundle ignores this switch even if the
environment value is accidentally present.

For release-like builds where `__DEV__` is false, use the backend's existing
development allowlist instead:

```env
APP_ENV=development
DEV_PREMIUM_EMAILS=tester@example.com
```

Sign in with that Firebase email and keep the backend reachable from the test
device. Never enable `APP_ENV=development` on the production backend.

## Stage 2 — ASR benchmark

Build a repeatable benchmark containing:

- correct recitations;
- deliberately omitted words;
- substituted words;
- repeated words;
- stopped and restarted phrases;
- beginner and fluent readers;
- different ages, accents, phones, microphones, and noise levels;
- short and long ayahs.

Report at least:

- Arabic word error rate and character error rate;
- omission-detection precision and recall;
- substitution-detection precision and recall;
- repetition-detection precision and recall;
- false accusations on correct recitations;
- median and 95th-percentile scoring latency;
- estimated inference cost per attempt.

Do not select a production model by visually reading transcripts alone.

## Stage 3 — Production hardening

- Generalize the current ASR service behind a swappable provider interface.
- Expand the server-owned corpus beyond the Al-Fatihah pilot.
- Persist attempts and word-level results to MongoDB.
- Add timeouts, retries, rate limits, concurrency limits, and cost monitoring.
- Add audio-retention consent and deletion controls if recordings are retained.
- Replace local progress with authenticated cross-device progress.

## Stage 4 — Reviewed learning content

- Finalize the Qaida curriculum and prerequisites.
- Record teacher-approved letter, word, and example audio.
- Produce reviewed mouth/tongue illustrations or animations.
- Add contextual Tajweed lessons and reviewed examples.
- Add content licenses, attribution, curriculum versions, and translations.

## Stage 5 — Advanced parity

- Near-real-time continuous recitation feedback
- Qari/user A-B comparison and slow looping
- Validated acoustic Tajweed-rule detectors
- Rewards, streaks, goals, and weekly challenges
- Offline lesson and Qari packs
- Broader localization
- On-device scoring feasibility study

Offline content does not imply offline AI scoring. On-device scoring requires a
separate model-size, battery, speed, and accuracy evaluation.

## Promotion criteria for public production release

The local pilot uses real AI now. Public production promotion still requires:

- benchmark targets have been agreed and met;
- false-positive behaviour is acceptable to teacher reviewers;
- model limitations are accurately described in the UI;
- privacy, cost, abuse prevention, and deletion behaviour are documented;
- production attempts include model and scorer version metadata;
- real-device testing passes on supported Android and iOS versions.
