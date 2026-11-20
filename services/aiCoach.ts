import { WorkoutLog, Exercise, AppSettings, BodyWeightLog } from '../types/workout';

export interface WorkoutSummaryContext {
  totalWorkouts: number;
  recentWorkoutsCount: number;
  muscleFrequency: Record<string, number>;
  personalBests: Record<string, { maxWeight: number; repsAtMax: number; date: string }>;
  totalVolumeAllTime: number;
  recentVolumeWeekly: number;
  bodyWeight: {
    startWeight?: number;
    currentWeight?: number;
    change?: number;
    count: number;
    latestDate?: string;
  };
}

export function buildWorkoutSummary(
  history: WorkoutLog[],
  exercises: Exercise[],
  bodyWeights: BodyWeightLog[] = []
): WorkoutSummaryContext {
  const muscleFrequency: Record<string, number> = {};
  const personalBests: Record<string, { maxWeight: number; repsAtMax: number; date: string }> = {};
  let totalVolumeAllTime = 0;
  let recentVolumeWeekly = 0;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const log of history) {
    totalVolumeAllTime += log.totalVolumeKg || 0;
    const logTime = new Date(log.startTime).getTime();
    if (logTime >= oneWeekAgo) {
      recentVolumeWeekly += log.totalVolumeKg || 0;
    }

    for (const ex of log.exercises) {
      const muscle = ex.muscleCategory || 'Lainnya';
      muscleFrequency[muscle] = (muscleFrequency[muscle] || 0) + 1;

      for (const set of ex.sets) {
        if (!set.completed) continue;
        const currentBest = personalBests[ex.exerciseName];
        if (!currentBest || set.weight > currentBest.maxWeight) {
          personalBests[ex.exerciseName] = {
            maxWeight: set.weight,
            repsAtMax: set.reps,
            date: log.startTime.slice(0, 10),
          };
        }
      }
    }
  }

  const recentWorkoutsCount = history.filter(
    (h) => new Date(h.startTime).getTime() >= oneWeekAgo
  ).length;

  const sortedWeights = [...bodyWeights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const startWeight = sortedWeights[0]?.weight;
  const currentWeight = sortedWeights[sortedWeights.length - 1]?.weight;
  const change = startWeight !== undefined && currentWeight !== undefined ? currentWeight - startWeight : undefined;

  return {
    totalWorkouts: history.length,
    recentWorkoutsCount,
    muscleFrequency,
    personalBests,
    totalVolumeAllTime,
    recentVolumeWeekly,
    bodyWeight: {
      startWeight,
      currentWeight,
      change: change !== undefined ? Math.round(change * 10) / 10 : undefined,
      count: bodyWeights.length,
      latestDate: sortedWeights[sortedWeights.length - 1]?.date,
    },
  };
}

export async function queryAiCoach(
  userPrompt: string,
  history: WorkoutLog[],
  exercises: Exercise[],
  settings: AppSettings,
  bodyWeights: BodyWeightLog[] = []
): Promise<string> {
  const summary = buildWorkoutSummary(history, exercises, bodyWeights);
  const lang = settings.language || 'id';

  // If user provided an API Key, call the external API
  if (settings.aiApiKey && settings.aiApiKey.trim().length > 5) {
    try {
      if (settings.aiProvider === 'gemini') {
        return await callGeminiApi(userPrompt, summary, settings.aiApiKey, lang);
      } else {
        return await callOpenAiApi(userPrompt, summary, settings.aiApiKey, lang);
      }
    } catch (err: any) {
      console.warn('AI API Call failed, falling back to local analysis:', err?.message);
      return (
        (lang === 'id'
          ? `[Peringatan: Gagal menghubungi API (${err?.message || 'Error'}). Menggunakan mode analisis lokal:]\n\n`
          : `[Notice: Failed to reach API (${err?.message || 'Error'}). Using local analysis mode:]\n\n`) +
        generateLocalSmartResponse(userPrompt, summary, history, lang)
      );
    }
  }

  // Otherwise, use local smart analytical simulation engine
  return generateLocalSmartResponse(userPrompt, summary, history, lang);
}

async function callGeminiApi(
  userPrompt: string,
  summary: WorkoutSummaryContext,
  apiKey: string,
  lang: string
): Promise<string> {
  const systemPrompt = `You are "BebanKu Coach", an expert strength training coach and fitness assistant.
Here is the user's real training context from their device:
- Total sessions completed: ${summary.totalWorkouts}
- Sessions in the past 7 days: ${summary.recentWorkoutsCount}
- Muscle frequency distribution: ${JSON.stringify(summary.muscleFrequency)}
- Personal Bests (Max Weight per lift): ${JSON.stringify(summary.personalBests)}
- Total Volume Lifted: ${summary.totalVolumeAllTime.toLocaleString()} kg
- Weekly Volume (past 7 days): ${summary.recentVolumeWeekly.toLocaleString()} kg
- Body Weight Data: Start=${summary.bodyWeight.startWeight ?? 'N/A'} kg, Current=${summary.bodyWeight.currentWeight ?? 'N/A'} kg, Change=${summary.bodyWeight.change ?? 'N/A'} kg (Entries logged: ${summary.bodyWeight.count})

Respond concisely, motivate the user, provide actionable gym & nutrition advice, and ALWAYS respond in ${
    lang === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English'
  }.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\nUser Question: ${userPrompt}` },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || (lang === 'id' ? 'Tidak ada respons dari Gemini.' : 'No response from Gemini.');
}

async function callOpenAiApi(
  userPrompt: string,
  summary: WorkoutSummaryContext,
  apiKey: string,
  lang: string
): Promise<string> {
  const systemPrompt = `You are "BebanKu Coach", an expert strength training coach.
User's data:
- Workouts completed: ${summary.totalWorkouts}
- Workouts this week: ${summary.recentWorkoutsCount}
- Muscles trained count: ${JSON.stringify(summary.muscleFrequency)}
- Personal records: ${JSON.stringify(summary.personalBests)}
- Total Volume: ${summary.totalVolumeAllTime} kg
- Body Weight: Start=${summary.bodyWeight.startWeight ?? 'N/A'} kg, Current=${summary.bodyWeight.currentWeight ?? 'N/A'} kg, Change=${summary.bodyWeight.change ?? 'N/A'} kg
Respond helpfully in ${lang === 'id' ? 'Bahasa Indonesia' : 'English'}. Keep it concise and motivating.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    (lang === 'id' ? 'Tidak ada respons dari OpenAI.' : 'No response from OpenAI.')
  );
}

function generateLocalSmartResponse(
  prompt: string,
  summary: WorkoutSummaryContext,
  history: WorkoutLog[],
  lang: string
): string {
  const p = prompt.toLowerCase();
  const isId = lang === 'id';

  // 1. Inquiries about body weight / berat badan
  if (
    p.includes('berat') ||
    p.includes('weight') ||
    p.includes('bb') ||
    p.includes('badan') ||
    p.includes('timbangan') ||
    p.includes('diet') ||
    p.includes('bulk') ||
    p.includes('cut')
  ) {
    if (summary.bodyWeight.count === 0) {
      return isId
        ? `⚖️ **Data Berat Badan:**\n\nKamu belum mencatat riwayat berat badan di tab **Riwayat > Statistik & Grafik**. Yuk catat berat badanmu secara rutin di pagi hari agar saya bisa menganalisis tren perubahan komposisi tubuhmu!`
        : `⚖️ **Body Weight Data:**\n\nYou haven't logged any body weight records yet under **History > Stats & Charts**. Start logging your morning weight so I can analyze your body composition trends!`;
    }

    const start = summary.bodyWeight.startWeight;
    const current = summary.bodyWeight.currentWeight;
    const change = summary.bodyWeight.change ?? 0;
    const changeStr = change > 0 ? `+${change} kg (Naik)` : change < 0 ? `${change} kg (Turun)` : 'Tetap (Stabil)';

    return isId
      ? `⚖️ **Analisis Progres Berat Badanmu:**\n\n` +
          `• Berat Awal: **${start} kg**\n` +
          `• Berat Saat Ini: **${current} kg**\n` +
          `• Perubahan Bersih: **${changeStr}**\n` +
          `• Total Catatan: **${summary.bodyWeight.count}x** pengukuran\n\n` +
          `💡 **Saran Coach:**\n` +
          (change > 0
            ? `Berat badanmu menunjukkan tren kenaikan (surplus kalori). Pastikan diimbangi dengan *progressive overload* di gym agar kenaikan didominasi oleh massa otot, bukan lemak.`
            : change < 0
            ? `Berat badanmu menunjukkan tren penurunan (defisit kalori). Pertahankan asupan protein minimal 1.8g - 2.2g per kg berat badan agar kekuatan dan massa otot tetap terjaga!`
            : `Berat badanmu stabil di sekitar angka ini. Jika tujuanmu adalah *body recomposition*, pertahankan beban latihan dan konsumsi protein yang cukup!`)
      : `⚖️ **Your Body Weight Analysis:**\n\n` +
          `• Starting Weight: **${start} kg**\n` +
          `• Current Weight: **${current} kg**\n` +
          `• Net Change: **${changeStr}**\n` +
          `• Total Logs: **${summary.bodyWeight.count}x** logs\n\n` +
          `💡 **Coach Advice:**\n` +
          (change > 0
            ? `Your weight is trending upward (caloric surplus). Ensure you apply progressive overload so the gain is lean muscle rather than fat.`
            : change < 0
            ? `Your weight is trending downward (caloric deficit). Keep protein high (1.8 - 2.2g per kg) to preserve muscle tissue and strength!`
            : `Your weight is steady. If you are aiming for body recomposition, maintain lifting intensity and stay consistent!`);
  }

  if (summary.totalWorkouts === 0) {
    return isId
      ? `Halo! Saya adalah BebanKu AI Coach. 🏋️‍♂️\n\nSaat ini kamu belum menyelesaikan sesi latihan apa pun. Yuk mulai sesi latihan pertamamu di tab "Latihan" (bisa mulai dari Program atau Latihan Spontan) agar saya memiliki data untuk dianalisis!\n\n💡 Tips awal: Jangan lupa catat beban & repetisi setiap set agar progresmu terpantau jelas.`
      : `Hello! I am your BebanKu AI Coach. 🏋️‍♂️\n\nYou haven't logged any workouts yet. Start your first session under the "Workout" tab (either a Quick Workout or a Routine) so I can start analyzing your progress!\n\n💡 Pro tip: Always log your weight and reps for each completed set.`;
  }

  // 2. Inquiries about Bench Press or specific exercise progress
  if (p.includes('bench') || p.includes('progres') || p.includes('progress') || p.includes('squat')) {
    const pbList = Object.entries(summary.personalBests);
    let pbText = '';
    if (pbList.length > 0) {
      pbText = pbList
        .map(([name, data]) => `• ${name}: ${data.maxWeight} kg x ${data.repsAtMax} reps (${data.date})`)
        .join('\n');
    } else {
      pbText = isId ? 'Belum ada data beban maksimal.' : 'No max weight recorded yet.';
    }

    return isId
      ? `📊 **Analisis Rekor & Progres Bebanmu:**\n\n${pbText}\n\n` +
          `🔥 **Rekomendasi Progressive Overload:**\n` +
          `Jika kamu bisa menyelesaikan target repetisi (misal 10-12 reps) dengan teknik bersih selama 2 sesi berturut-turut, tambahkan beban 1.25 - 2.5 kg di sesi berikutnya!`
      : `📊 **Your Personal Records & Progress:**\n\n${pbText}\n\n` +
          `🔥 **Progressive Overload Tip:**\n` +
          `Once you hit your rep target (e.g. 10-12 reps) with clean form for 2 consecutive sessions, increase the load by 2.5 - 5 lbs (1-2.5 kg)!`;
  }

  // 3. Inquiries about undertrained muscles / muscle frequency
  if (
    p.includes('otot') ||
    p.includes('kurang') ||
    p.includes('muscle') ||
    p.includes('latih') ||
    p.includes('frekuensi')
  ) {
    const categories = ['Dada', 'Punggung', 'Kaki', 'Bahu', 'Tangan', 'Core'];
    const distribution = categories.map((cat) => {
      const count = summary.muscleFrequency[cat] || 0;
      return `• ${cat}: ${count}x sesi`;
    });

    const leastTrained = categories
      .map((cat) => ({ cat, count: summary.muscleFrequency[cat] || 0 }))
      .sort((a, b) => a.count - b.count);

    const suggest = leastTrained[0]?.cat || 'Kaki';

    return isId
      ? `🎯 **Distribusi Latihan Ototmu:**\n\n${distribution.join('\n')}\n\n` +
          `⚡ **Evaluasi:** Otot **${suggest}** terlihat paling sedikit dilatih dibandingkan lainnya. Pertimbangkan untuk memprioritaskannya di sesi latihan berikutnya!`
      : `🎯 **Your Muscle Group Distribution:**\n\n${distribution.join('\n')}\n\n` +
          `⚡ **Evaluation:** **${suggest}** appears to have the fewest logged sessions. Consider dedicating your next routine focus to it!`;
  }

  // 4. Routine builder or workout split suggestions
  if (p.includes('menu') || p.includes('jadwal') || p.includes('split') || p.includes('hari') || p.includes('routine')) {
    return isId
      ? `📅 **Rekomendasi Jadwal Latihan 3 Hari (Push - Pull - Legs):**\n\n` +
          `1. **Hari 1 (Push - Dada, Bahu, Tricep):**\n` +
          `   - Bench Press (3 set x 8-10 reps)\n` +
          `   - Overhead Press (3 set x 10 reps)\n` +
          `   - Tricep Pushdown / Dips (3 set x 12 reps)\n\n` +
          `2. **Hari 2 (Pull - Punggung & Bicep):**\n` +
          `   - Lat Pulldown / Pull Up (3 set x 10 reps)\n` +
          `   - Barbell Row / Cable Row (3 set x 10 reps)\n` +
          `   - Bicep Curl (3 set x 12 reps)\n\n` +
          `3. **Hari 3 (Legs & Core - Kaki & Perut):**\n` +
          `   - Barbell Squat (3 set x 8-10 reps)\n` +
          `   - Romanian Deadlift (3 set x 10 reps)\n` +
          `   - Plank / Hanging Leg Raise (3 set)\n\n` +
          `💡 Kamu bisa langsung membuat template ini di tab "Program"!`
      : `📅 **Recommended 3-Day Workout Split (Push - Pull - Legs):**\n\n` +
          `1. **Day 1 (Push - Chest, Shoulders, Triceps):**\n` +
          `   - Bench Press (3 sets x 8-10 reps)\n` +
          `   - Overhead Press (3 sets x 10 reps)\n` +
          `   - Tricep Pushdown (3 sets x 12 reps)\n\n` +
          `2. **Day 2 (Pull - Back & Biceps):**\n` +
          `   - Lat Pulldown / Pull Ups (3 sets x 10 reps)\n` +
          `   - Cable / Barbell Row (3 sets x 10 reps)\n` +
          `   - Bicep Curl (3 sets x 12 reps)\n\n` +
          `3. **Day 3 (Legs & Core):**\n` +
          `   - Barbell Squat (3 sets x 8-10 reps)\n` +
          `   - Romanian Deadlift (3 sets x 10 reps)\n` +
          `   - Hanging Leg Raises (3 sets)\n\n` +
          `💡 You can build these right now in the "Routines" tab!`;
  }

  // Default smart summary & motivation
  return isId
    ? `💪 **Ringkasan Aktivitas Latihanmu:**\n\n` +
        `• Total Sesi: **${summary.totalWorkouts}** latihan\n` +
        `• Sesi 7 Hari Terakhir: **${summary.recentWorkoutsCount}** sesi\n` +
        `• Total Beban Terangkat: **${summary.totalVolumeAllTime.toLocaleString()} kg**\n` +
        (summary.bodyWeight.currentWeight ? `• Berat Badan Terakhir: **${summary.bodyWeight.currentWeight} kg**\n\n` : `\n`) +
        `Pertahankan konsistensi latihanmu! Istirahat 48 jam per kelompok otot dan perhatikan asupan protein (1.6 - 2.2g per kg berat badan) untuk pemulihan optimal.\n\n` +
        `💡 *Ada yang ingin kamu tanyakan mengenai beban, berat badan, atau variasi gerakan tertentu?*`
    : `💪 **Your Workout Summary:**\n\n` +
        `• Total Sessions: **${summary.totalWorkouts}** workouts\n` +
        `• Sessions Past 7 Days: **${summary.recentWorkoutsCount}**\n` +
        `• Total Volume Lifted: **${summary.totalVolumeAllTime.toLocaleString()} kg**\n` +
        (summary.bodyWeight.currentWeight ? `• Latest Body Weight: **${summary.bodyWeight.currentWeight} kg**\n\n` : `\n`) +
        `Consistency is key! Keep progressive overload steady and aim for 1.6-2.2g of protein per kg of body weight for optimal hypertrophy.\n\n` +
        `💡 *Feel free to ask about specific weights, body composition, or routine adjustments!*`;
}
