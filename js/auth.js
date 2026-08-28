function showMsg(el, text, type){
  el.textContent = text;
  el.className = "msg show " + type;
}

async function handleRegister(event){
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector("button[type=submit]");
  const msg = document.getElementById("msg");

  const gamerId = form.gamer_id.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;
  const country = form.country.value;

  if(!/^[A-Za-z0-9_]{3,20}$/.test(gamerId)){
    showMsg(msg, "El Gamer ID debe tener 3-20 caracteres: letras, números o _", "error");
    return;
  }
  if(password.length < 6){
    showMsg(msg, "La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Creando Gamer ID...";

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { gamer_id: gamerId, country } }
  });

  btn.disabled = false;
  btn.textContent = "Crear mi Gamer ID";

  if(error){
    if(error.message.includes("duplicate key") || error.message.includes("unique")){
      showMsg(msg, "Ese Gamer ID ya está en uso. Elige otro.", "error");
    } else {
      showMsg(msg, error.message, "error");
    }
    return;
  }

  if(data.session){
    window.location.href = "dashboard.html";
  } else {
    showMsg(msg, "Cuenta creada. Revisa tu correo para confirmar, luego inicia sesión.", "ok");
    form.reset();
  }
}

async function handleLogin(event){
  event.preventDefault();
  const form = event.target;
  const btn = form.querySelector("button[type=submit]");
  const msg = document.getElementById("msg");

  btn.disabled = true;
  btn.textContent = "Entrando...";

  const { error } = await sb.auth.signInWithPassword({
    email: form.email.value.trim(),
    password: form.password.value
  });

  btn.disabled = false;
  btn.textContent = "Iniciar sesión";

  if(error){
    showMsg(msg, "Correo o contraseña incorrectos.", "error");
    return;
  }
  window.location.href = "dashboard.html";
}

async function handleLogout(){
  await sb.auth.signOut();
  window.location.href = "login.html";
}

async function requireSession(){
  const { data: { session } } = await sb.auth.getSession();
  if(!session){
    window.location.href = "login.html";
    return null;
  }
  return session;
    }
