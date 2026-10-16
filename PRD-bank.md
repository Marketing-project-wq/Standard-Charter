# PRD — SC Games 2026 Portal

| | |
|---|---|
| **Product** | SC Games 2026 staff sports portal |
| **Client** | Standard Chartered |
| **Built by** | 20FIT |
| **Event dates** | Fri 16 – Sat 17 Oct 2026 (SGT) |
| **Prototype** | `SC Games Portal.dc.html` |
| **Status** | Draft v1 |

---

## 1. Overview

A web portal for Standard Chartered staff taking part in, or following, the SC Games. It does five things:

1. **Registration** for athletes: email OTP login, sport selection, team registration and an athlete profile.
2. **Schedule** for every sport and session, searchable by sport, venue or team. Each session expands to show all of its matches.
3. **Live tracking** for every sport, with a visual suited to the sport type (lanes, court and score, frame tables).
4. **Leaderboards**: overall by branch, per sport, and a "who's still in" stage chart.
5. **Cheer Zone** for staff who aren't competing: send cheers to branches and congratulate winners.

### Goals
- An athlete can find their next match time in under 10 seconds.
- Any staff member can follow live progress for every sport without a login.
- Registration takes under 3 minutes.

### Non-goals (v1)
- Payments, merchandise and ticketing.
- Native mobile apps. The portal is responsive web only.
- Official score-entry tools and a shared score feed. Live scores are simulated for now. The scoring engine and the local operator panel (rule overrides, result status codes) read their rules from the rulebook (§6.1). The real results source is still open (§14).

---

## 2. Users

| Persona | Description | Needs |
|---|---|---|
| **Athlete** | Staff member registered for one or more sports | Register, see their race and match times, track their team's position |
| **Team captain** | Athlete who creates a team | Register a team name, share a team code with teammates |
| **Supporter** | Staff member who isn't competing | Follow live scores, cheer their branch, congratulate winners |
| **Admin** (out of scope for UI) | Event ops | Maintain the schedule, enter results, moderate cheers |

---

## 3. Information architecture

```
Top nav: LIVE (count) · SCHEDULE · LEADERBOARD · CHEER ZONE · [LOGIN] [REGISTER] / [MY RACES]

Home
 ├─ Hero + CTAs (View schedule, Cheer your branch)
 ├─ Live now (cards for live sports)
 ├─ Calendar & Schedule widget (All / Team / Individual tabs, next race, upcoming list)
 ├─ Branch leaderboard (top 6)
 └─ Congratulate the winners

Live
 ├─ Sport strip (all 20 sports, LIVE / UPCOMING)
 └─ Detail: sport visual · live report feed · cheer buttons

Schedule
 ├─ Search (sport, venue, team) · day tabs · type tabs · sport chips · find-team chips
 ├─ Team matches panel (when the search matches a team)
 └─ Session list → expand to show all matches (livescore style)

Leaderboard
 ├─ Sport chips (Overall + 20 sports)
 ├─ "Who's still in" stage chart (per sport)
 └─ Standings table

Cheer Zone
 ├─ Cheer board (branches ranked by cheers)
 ├─ Cheer composer (pick branch, cheer type, optional message)
 ├─ Cheer wall (live feed)
 └─ Congratulate the winners

Register / Login (stepper)
My Races (logged-in athletes)
```

---

## 4. Registration flow

### 4.1 Steps

```
1. Email → 2. Verify (OTP) → 3. Sports → 4. Team* → 5. Profile → 6. Done → My Races
                                              *only if a team sport is selected
```

| # | Step | Fields | Validation | Next |
|---|---|---|---|---|
| 1 | **Email** | Work email | Valid email format. Production: restrict to SC domains (e.g. `@sc.com`) | Send OTP → 2 |
| 2 | **Verify** | 6-digit OTP | Must match the issued code. Expires after 10 minutes. Resend available | Existing user → **My Races**. New user → 3 |
| 3 | **Sports** | Multi-select from the 20 sports | At least 1 sport | Has a team sport → 4. Otherwise → 5 |
| 4 | **Team** | Team name for each selected team sport | Required for each team sport. Unique within the sport | → 5 |
| 5 | **Profile** | Full name, date of birth, branch, division, photo | Name, DOB, branch and division required. Photo optional (recommended) | → 6 |
| 6 | **Done** | Summary of the athlete card and selected sports | — | **See my race schedule** → My Races |

### 4.2 Step rules
- The stepper on the left shows ✓ for completed steps, highlights the current step and dims future steps.
- The **Team** step is hidden when only individual sports are selected.
- **Back** keeps everything already entered.
- **Login** uses the same Email → OTP steps. If the email is already registered, the user goes straight to My Races.
- **Add sports** (from My Races) reopens the flow at step 3 with the profile pre-filled.

### 4.3 Team registration
- The person who registers a team becomes its **captain**.
- Each team gets a **team code** (format `SC-####`) for teammates to join. *Joining by code is v1.1. See Open questions.*
- Team names appear in the schedule, team search, leaderboards and the stage chart.

### 4.4 Branch list (all regions except Europe)
| Region | Branches |
|---|---|
| Asia | Singapore, Hong Kong, Mainland China, Taiwan, Korea, Japan, India, Indonesia, Malaysia, Thailand, Vietnam, Philippines, Bangladesh, Sri Lanka, Pakistan, Nepal, Brunei, Macau |
| Middle East | UAE, Saudi Arabia, Bahrain, Qatar, Oman, Jordan, Iraq |
| Africa | Kenya, Nigeria, Ghana, South Africa, Uganda, Tanzania, Zambia, Botswana, Mauritius, Côte d'Ivoire, Cameroon, Zimbabwe, Egypt |
| Americas | United States, Brazil, Argentina, Colombia |
| Oceania | Australia |

The branch picker has a search box and groups branches by region. Each branch has a 2-letter code (e.g. SG, HK, KE) used as its badge everywhere.

### 4.5 Divisions
Corporate & Investment Banking · Wealth & Retail Banking · Ventures · Technology & Operations · Risk · Finance · Compliance · Legal · People & Culture · Brand & Marketing · Group Functions

---

## 5. Sports and schedule

### 5.1 Sports (20 scheduled; Padel and Hyrox are in the rulebook but not yet scheduled)

| Sport | Type | Visual mode | Sessions | Venue |
|---|---|---|---|---|
| Badminton | Individual | Racket | Fri 10am–5pm · Sat 10am–3pm | Wyse Active Hub |
| Basketball (M) | Team | Match | Fri 9am–9pm · Sat 9am–3pm | Jurong West Centre |
| Basketball (W) | Team | Match | Fri 9am–9pm · Sat 9am–3pm | Jurong West Centre |
| Bowling | Individual | Target | Fri 10am–7pm | Orchid Country Club |
| Cage Cricket | Individual (6 per cage) | Manual | Sat 8am–2pm | CBP1 (SCB Office) |
| Cricket | Team | Match | Fri 8am–6pm | Ceylon Sports Club |
| Darts | Individual | Target | Fri 9am–6pm | Good Vibes |
| Dragon Boat | Team | Race | Sat 8am–12pm | Water Sports Ctr |
| Football | Team | Match | Fri 3pm–11pm | Our Tampines Hub |
| Futsal | Team | Match | Sat 8am–2pm | Kovan Sports Ctr |
| Golf | Individual | Target (low score wins) | Fri 8am–6pm | Orchid Country Club |
| Netball (Mixed) | Team | Match | Fri 12pm–7pm | Jurong West Centre |
| Pickleball | Individual | Racket | Fri 8am–6pm | The Sports Arena |
| Pool | Individual | Target | Fri 9am–9pm | Pool Fusion Bugis |
| Rock Climbing | Individual | Climb | Fri 2pm–6pm | Outpost Climbing |
| Running | Individual | Race | Sat 7am–12pm | CCK Stadium |
| Swimming | Individual | Race | Fri 8am–4pm | CSC |
| Table Tennis | Individual | Racket | Fri 9am–9pm | New Century TT |
| Tennis | Individual | Racket | Fri 1pm–10pm · Sat 8am–2pm | UWC Dover |
| Volleyball (W) | Team | Match | Sat 8am–1pm | Jurong West Centre |

### 5.2 Schedule page
- **Filters:** day (Both / Fri 16 / Sat 17), type (All / Team / Individual), sport chips (multi-select) and search. All filters combine.
- **Search** matches sport name, venue, team name, branch name or branch code (from 2 characters).
- **Find team chips:** one tap fills the search with a team name. The user's own team appears first, marked "(you)".
- **Team matches panel:** appears when the search matches a team. It lists every fixture for that team with day, time, sport, opponent, venue and court, and status (Live / Upcoming / FT with score).
- **Session row:** date, sport, type tag, "You're in" tag, time, venue and status (LIVE / DONE / UPCOMING).
- **Expand a session** (click the row or **See matches ▾**) to show a livescore-style list:
  - Grouped by round: Group stage → Quarter-finals → Semi-finals → Final.
  - Head-to-head row: status (FT / LIVE) · team A + badge · score box `A | B` (or kick-off time if not started) · badge + team B · court.
  - Race and target sports: heat rows with the participant badges and the result ("Won by …" / "In progress" / start time).
  - Header button: **Watch live track** (if live) or **View standings**.
- A result count is shown ("X of Y sessions"), with an empty state when nothing matches.

---

## 6. Live tracking

Every sport has a live detail view. Sports not currently in session show **UPCOMING** with their start time, and their visual starts from zero.

| Mode | Sports | Visual |
|---|---|---|
| **Race** | Swimming, Running, Dragon Boat | Horizontal lanes with position markers (P1… / 1ST once finished), progress trail and finish line |
| **Climb** | Rock Climbing | Vertical climbing wall. Each climber's marker rises with their height. Top line at 15 m |
| **Match** | Basketball M/W, Netball, Football, Futsal, Cricket, Volleyball | Scoreboard plus a static court showing each side's live score in large type, period and clock, and a momentum bar. **No moving ball** |
| **Racket** | Badminton, Pickleball, Table Tennis, Tennis | Static court showing the current game points for each player and the game number, plus a table of completed game scores and serve indicator. **No moving shuttle** |
| **Target** | Bowling, Darts, Golf, Pool | Score grid per player (frames with marks and running total, darts visits with remaining score, holes with par, frames won) with highlights for strikes, 140+, birdies and frame wins. Bowling also shows a lane and a pin deck. Golf ranks lowest score first |
| **Manual** | Cage Cricket | Rulebook has no readable scoring rules. Players and points are entered manually by the organisers (operator mode) |

### 6.1 Rulebook and scoring

- `rulebook/*.md` is the source of truth for scoring. Each sport file has YAML frontmatter with the parameters the live scoring engine reads (points to win, sets, periods, penalties, status codes, tie-breakers). Values the rulebook does not state are `null` and listed in `unverified_fields`. Nothing is guessed.
- The public rulebook (`/rulebook/`, no login) renders the same Markdown with a sidebar of all 22 sports and full-text search.
- Each live view shows a rules panel: the rules in force, the source and check date, a warning for anything unverified, the meaning of each result status (DNS, DNF, DQ, W/O, RET) taken from the rulebook, and a link to the rulebook page.
- **Operator mode** (toggle in the rules panel, or `?operator=1`) lets organisers set an unverified parameter, mark a competitor with a result status, and enter Cage Cricket points. These changes apply in that browser only until a shared score store exists.
- Badminton keeps the 21-point game until BWF Laws v6.0 takes effect on 4 January 2027, then switches to 15 points by match date. The v6.0 details the rulebook does not state stay flagged.

Every detail view also includes:
- **Live report:** a timestamped feed of the latest events, up to 6.
- **Cheer from the stands:** a "GO {code}!" button for each competitor's branch.

---

## 7. Leaderboards

### 7.1 Overall (branches)
- Medal points: Gold 5 · Silver 3 · Bronze 1.
- Columns: rank, branch badge, branch / team, progress bar (relative to the leader), medals (G/S/B), points.

### 7.2 Per sport
**Who's still in** chart:
- Summary counts: **Advanced**, **Still in**, **Out**.
- One row per team or athlete, with stage columns:
  - Head-to-head sports: Group → Quarter → Semi → Final.
  - Race: Heats → Repechage → Semi → Final.
  - Target: Round 1 → Round 2 → Semi → Final.
- Cell states: blue ✓ = stage won · green LIVE = playing now · green NEXT = next stage · red OUT = knocked out here · grey = not reached.
- Teams that are out are shown greyed. The user's own entry is marked "(you)".
- If the sport hasn't started, every entry shows as Still in, with the start time.

**Standings table:** rank, badge, team / athlete, branch, progress bar, record (W-L, heats or average), points. The user's own row is highlighted with a **YOU** tag.

---

## 8. Cheer Zone

- **Cheer board:** branches ranked by total cheers, with a bar. Clicking a branch selects it.
- **Composer:** four cheer types (CLAP · GO GO GO · LEGEND · MVP) plus an optional message (max 80 characters).
- **Cheer wall:** a real-time feed of who cheered whom, the cheer type and message, and when.
- **Congratulate the winners:** a card for each recent result. One congratulation per user per result. The button changes to "Congratulated".
- A confirmation toast appears after every cheer or congratulation.
- No login is needed to cheer. If logged in, the user's name is shown; otherwise "You".
- **Moderation:** messages go through a profanity filter and admin removal (see §9).

---

## 9. My Races (logged in)

- **Athlete card:** photo or initials, name, branch code, branch and division.
- **Your next race:** the next upcoming or live session the user is registered for.
- **One card per registered sport:**
  - Type tag, status, team name, sessions and venue.
  - **Leaderboard position** `#rank / total`, a progress bar, and the gap to the entry above ("X pts behind Y").
  - CTA: **Track live** (if live) or **View standings**.
- Actions: **Add sports**, **Log out**.

---

## 10. Data model (suggested)

```ts
User        { id, email, name, dob, branchCode, division, photoUrl, createdAt }
Branch      { code, name, region }               // non-Europe only
Sport       { id, name, type: 'team'|'individual', mode: 'race'|'climb'|'match'|'racket'|'target', venue }
Session     { id, sportId, day: 'FRI'|'SAT', start, end }
Team        { id, sportId, name, code, captainUserId, branchCode }
TeamMember  { teamId, userId, role: 'captain'|'member' }
Registration{ userId, sportId, teamId? }
Fixture     { id, sessionId, round, court, startAt, kind: 'vs'|'heat',
              sideA?, sideB?, entrants?[], status: 'UP'|'LIVE'|'DONE', scoreA?, scoreB?, winnerId? }
LiveState   { fixtureId, payload (mode-specific), updatedAt }
Standing    { sportId, entrantId, rank, points, record, stageReached, stageStatus: 'adv'|'in'|'out' }
Cheer       { id, fromUserId?, toBranchCode, type, message?, createdAt }
Congrats    { resultId, userId, createdAt }
Otp         { email, codeHash, expiresAt, attempts }
```

### Suggested API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/otp` | Send an OTP to the email |
| POST | `/auth/verify` | Verify the OTP and return a session plus an `isNewUser` flag |
| GET/PUT | `/me` | Get or update the profile |
| POST | `/me/registrations` | Register for sports, creating teams for team sports |
| GET | `/sports`, `/sessions` | Schedule data |
| GET | `/sessions/:id/fixtures` | Expanded match list |
| GET | `/fixtures?team=` | Team search |
| GET | `/live` · WS `/live/stream` | Live states (push updates roughly every 2 s) |
| GET | `/leaderboard/overall`, `/leaderboard/:sportId` | Standings and stage chart |
| GET/POST | `/cheers` · WS `/cheers/stream` | Cheer board and wall |
| POST | `/results/:id/congrats` | Congratulate a winner |

---

## 11. Non-functional requirements

- **Responsive:** 360 px to 1440 px+. Chip rows and pills never wrap their text. Wide tables scroll horizontally.
- **Real-time:** live and cheer updates within 3 s (WebSocket or SSE, with polling as a fallback).
- **Security:** OTPs are single-use, expire after 10 minutes, are limited to 5 attempts, and resends are rate-limited (1 per 30 s). Photos are stored in a private bucket and served as signed URLs.
- **Privacy:** date of birth is never shown publicly. Public views show only name, branch, team and photo.
- **Accessibility:** text contrast at least 4.5:1, tap targets at least 44 px, focus states on all inputs.
- **Timezone:** all times in SGT.

---

## 12. Design

- **Colours (Standard Chartered):** Blue `#0473EA` · Green `#38D200` · Navy `#05103F`. Neutrals: `#F3F5F9` background, `#E3E7EF` borders, `#0B1430` text, `#5B6478` muted text.
- **Type:** Barlow Condensed (headings, labels, scores) · Barlow (body) · JetBrains Mono (dates, times, metadata).
- **Style reference:** 20FIT. Dark pill nav, uppercase condensed labels, mono date strip, dark "next match" card, rounded white cards.

---

## 13. Acceptance criteria (key)

- [ ] A new user can complete Email → OTP → Sports → (Team) → Profile → Done in one session.
- [ ] The Team step only appears when at least one team sport is selected.
- [ ] A returning email skips straight to My Races after OTP.
- [ ] Searching a team name shows all of that team's fixtures with time, opponent and venue.
- [ ] Clicking a schedule session expands the full match list grouped by round.
- [ ] All 20 sports appear on the Live page, marked LIVE or UPCOMING correctly against SGT time.
- [ ] The per-sport leaderboard shows the stage chart with Advanced / Still in / Out counts.
- [ ] Cheers update the cheer board and wall in real time.
- [ ] A user can congratulate each winner once.

---

## 14. Open questions

1. **Padel and Hyrox:** the rulebook has 22 sports but the schedule lists 20. Sessions and venues for Padel and Hyrox are needed before they appear on Live and Schedule.
2. **Joining a team:** do teammates join with the team code during registration, or does the captain add them?
3. **Roster limits:** minimum and maximum players per team sport, and the number of sports one person can enter.
4. **Email domains:** which domains are allowed (`@sc.com` only, or others)?
5. **Results source:** who enters scores, and through which tool or feed?
6. **Real fixtures and draws:** when will the actual brackets be available?
7. **Logo usage:** approval for using the SC logo in the portal.
