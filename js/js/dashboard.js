let currentProfile = null;

async function loadDashboard(){
  const session = await requireSession();
  if(!session) return;

  const { data: profile, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if(error){
    document.getElementById("dash-root").innerHTML =
      `<p class="msg error show">No se pudo cargar tu perfil: ${error.message}</p>`;
    return;
  }
  currentProfile = profile;
  renderProfile(profile);
  loadDailyChallenge(profile.id);
}

function xpForNextLevel(level){
  return 50 * Math.pow(level, 2);
}

function renderProfile(p){
  document.getElementById("gid-handle").textContent = "@" + p.gamer_id;
  document.getElementById("gid-rank").textContent = p.rank;
  document.getElementById("gid-level").textContent = "Nv " + p.level;
  document.getElementById("gid-xp").textContent = p.xp.toLocaleString("es");
  document.getElementById("gid-score").textContent = p.gamer_score.toLocaleString("es");
  document.getElementById("gid-points").textContent = p.gamer_points.toLocaleString("es");
  document.getElementById("gid-streak").textContent = "🔥 " + p.streak_count;

  const xpStart = 50 * Math.pow(p.level - 1, 2);
  const xpEnd = xpForNextLevel(p.level);
  const pct = Math.min(100, Math.round(((p.xp - xpStart) / (xpEnd - xpStart)) * 100));
  document.getElementById("gid-ring").style.setProperty("--pct", pct);
}

async function loadDailyChallenge(profileId){
  const { data: challenges } = await sb
    .from("challenges")
    .select("*")
    .eq("type", "daily")
    .eq("active", true)
    .limit(1);

  if(!challenges || !challenges.length) return;
  const challenge = challenges[0];

  const { data: done } = await sb
    .from("user_challenges")
    .select("id")
    .eq("profile_id", profileId)
    .eq("challenge_id", challenge.id)
    .eq("completed_on", new Date().toISOString().slice(0,10));

  const box = document.getElementById("challenge-box");
  const alreadyDone = done && done.length > 0;

  box.innerHTML = `
    <div class="eyebrow">Reto de hoy</div>
    <h3>${challenge.title}</h3>
    <p>${challenge.description || ""} · +${challenge.xp_reward} XP · +${challenge.points_reward} Gamer Points</p>
    <button id="challenge-btn" class="btn btn-primary" ${alreadyDone ? "disabled" : ""}>
      ${alreadyDone ? "Ya completado hoy ✓" : "Completar reto"}
    </button>
  `;

  if(!alreadyDone){
    document.getElementById("challenge-btn").addEventListener("click", async () => {
      const btn = document.getElementById("challenge-btn");
      btn.disabled = true;
      btn.textContent = "Enviando...";
      const { data, error } = await sb.rpc("complete_challenge", { p_challenge_id: challenge.id });
      if(error){
        btn.disabled = false;
        btn.textContent = "Completar reto";
        alert("No se pudo completar: " + error.message);
        return;
      }
      renderProfile(data);
      btn.textContent = "Ya completado hoy ✓";
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
