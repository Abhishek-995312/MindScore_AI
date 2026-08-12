  const API_URL = 'http://127.0.0.1:8000/predict';
  const form = document.getElementById('predict-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorBox = document.getElementById('error-box');

  const stPlaceholder = document.getElementById('state-placeholder');
  const stLoading = document.getElementById('state-loading');
  const stResult = document.getElementById('state-result');

  const gaugeFill = document.getElementById('gauge-fill');
  const scoreNumber = document.getElementById('score-number');
  const resultTag = document.getElementById('result-tag');
  const resultDesc = document.getElementById('result-desc');

  // Assumes the model's score is roughly on a 0–10 scale.
  // If your model's actual output range differs, adjust SCORE_MAX below.
  const SCORE_MAX = 10;
  const CIRCUMFERENCE = 2 * Math.PI * 90;
  gaugeFill.style.strokeDasharray = CIRCUMFERENCE;

  function showState(name){
    stPlaceholder.style.display = name === 'placeholder' ? 'block' : 'none';
    stLoading.style.display = name === 'loading' ? 'flex' : 'none';
    stResult.style.display = name === 'result' ? 'flex' : 'none';
  }

  function bandFor(score){
    const pct = score / SCORE_MAX;
    if (pct >= 0.7) return {
      label: '💚 Balanced',
      color: '#5EEAD4',
      line: "You're in a good rhythm — small, steady habits are clearly paying off. Keep nurturing them. 🌿"
    };
    if (pct >= 0.45) return {
      label: '🌤️ Mixed signals',
      color: '#F5C56B',
      line: "A bit of give and take here. One or two gentle tweaks — an earlier bedtime, a shorter scroll — could tip things toward balance. 🌱"
    };
    return {
      label: '🧡 Needs care',
      color: '#FF8A65',
      line: "Things look stretched thin right now. Be kind to yourself — small resets (sleep, a walk, less screen time) can make a real difference. 🫶"
    };
  }

  function renderResult(score){
    const clamped = Math.max(0, Math.min(SCORE_MAX, score));
    const pct = clamped / SCORE_MAX;
    const offset = CIRCUMFERENCE * (1 - pct);
    const band = bandFor(clamped);

    scoreNumber.textContent = Number.isInteger(score) ? score : score.toFixed(2);
    gaugeFill.style.stroke = band.color;
    resultTag.textContent = band.label;
    resultTag.style.color = band.color;
    resultTag.style.borderColor = band.color + '59';
    resultDesc.textContent = `${band.line} (Score: ${score} — a reflection of the habits entered, not a diagnosis.)`;

    showState('result');
    requestAnimationFrame(() => { gaugeFill.style.strokeDashoffset = offset; });
  }

  // --- Gentle floating emojis in the background, just for warmth ✨ ---
  function spawnFloatingEmojis(){
    const layer = document.getElementById('float-layer');
    if (!layer) return;
    const emojis = ['🌙','⭐','✨','🍃','💫','🌸','☁️','🧠','💛'];
    const count = 16;
    for (let i = 0; i < count; i++){
      const el = document.createElement('span');
      el.className = 'float-emoji';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = Math.random() * 100 + 'vw';
      el.style.fontSize = (14 + Math.random() * 16) + 'px';
      el.style.animationDuration = (14 + Math.random() * 16) + 's';
      el.style.animationDelay = (Math.random() * -20) + 's';
      layer.appendChild(el);
    }
  }
  spawnFloatingEmojis();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    gaugeFill.style.strokeDashoffset = CIRCUMFERENCE;
    showState('loading');
    submitBtn.disabled = true;
    submitBtn.textContent = '🔮 Scoring…';

    const payload = {
      Age: Number(document.getElementById('Age').value),
      Gender: document.getElementById('Gender').value,
      Country: document.getElementById('Country').value.trim(),
      Academic_Level: document.getElementById('Academic_Level').value,
      Most_Used_Platform: document.getElementById('Most_Used_Platform').value,
      Purpose_Of_Use: document.getElementById('Purpose_Of_Use').value,
      Avg_Daily_Usage_Hours: Number(document.getElementById('Avg_Daily_Usage_Hours').value),
      Daily_Unlocks: Number(document.getElementById('Daily_Unlocks').value),
      Study_Hours: Number(document.getElementById('Study_Hours').value),
      Physical_Activity_Hours: Number(document.getElementById('Physical_Activity_Hours').value),
      Sleep_Hours_Per_Night: Number(document.getElementById('Sleep_Hours_Per_Night').value),
      Stress_Level: document.getElementById('Stress_Level').value,
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const detail = errBody && errBody.detail
          ? (Array.isArray(errBody.detail) ? errBody.detail.map(d => d.msg).join('; ') : errBody.detail)
          : `Request failed with status ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      renderResult(data.predicted_mental_health_score);

    } catch (err) {
      showState('placeholder');
      errorBox.textContent = err.message && err.message.includes('Failed to fetch')
        ? '🔌 Hmm, the API seems offline — make sure uvicorn is running.'
        : `⚠️ Prediction failed: ${err.message}`;
      errorBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '✨ Run prediction ✨';
    }
  });
