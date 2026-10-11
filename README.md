# ITSA 2026-27 Live Tech & AI Quiz

## What this version does
- 30 editable questions.
- 40 seconds per question.
- 2 marks for every correct answer.
- Each student enters **Name + Class** on their phone.
- Each student gets a **different randomized question order**, so students sitting together do not see the same next question.
- Student screens never show the leaderboard.
- Operator dashboard shows the live leaderboard and final podium.
- Questions/options/answers are editable in `questions.js`.
- Event settings are editable in `quiz-config.js`.

## Deploy online for students using mobile data
1. Create a **private** GitHub repository and upload all project files/folders from this ZIP.
2. In Render, choose **New → Web Service** and connect that GitHub repository.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`; choose the Free instance for testing.
4. After deployment, use the public `https://YOUR-SERVICE.onrender.com` URL for students and `https://YOUR-SERVICE.onrender.com/operator.html` for the operator dashboard.
5. In Render Environment settings, add `OPERATOR_PASSWORD` and set a new operator password. Test all phones and the projector before the event. Free hosting may sleep when idle and take about a minute to wake; open and test the site shortly before the competition.

## Run it on the college laptop
1. Install Node.js (LTS) on the laptop.
2. Open a terminal in this folder.
3. Run:
   `npm install`
4. Run:
   `npm start`
5. On the laptop, open:
   `http://localhost:3000/operator.html`
6. Login with the operator password from `quiz-config.js`.
7. For student phones, use the laptop's local Wi-Fi IP, for example:
   `http://192.168.1.10:3000`
   All phones and the laptop must be on the same Wi-Fi/hotspot.
8. Project only the **operator dashboard**. Students use the normal URL on their phones.

## Important
- Before the event, change the operator password in `quiz-config.js`.
- Allow Node.js through Windows Firewall on Private networks if Windows asks.
- Do not expose this simple event server directly to the public Internet without adding proper authentication/HTTPS.

## Editing questions
Open `questions.js`. Each question has:
- `text`
- four `options`
- `answer` (A/B/C/D)

Keep exactly one correct answer per question.

## Scoring
This version uses exactly 2 marks per correct answer. Faster answers are used as a tie-breaker in the leaderboard (lower total answer time ranks higher when scores are equal).
