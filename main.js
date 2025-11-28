// main.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

/* ====== تكوين Firebase (استبدل إذا لزم) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyCHgPyMNy7puBLsxIJNgc51Y7YJMaHAOoI",
  authDomain: "wep-zyad.firebaseapp.com",
  projectId: "wep-zyad",
  storageBucket: "wep-zyad.firebasestorage.app",
  messagingSenderId: "197850687110",
  appId: "1:197850687110:web:86ed3244f7c9f60cd01307",
  measurementId: "G-BS1WX0ZJ36",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ====== عناصر DOM ====== */
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authContainer = document.getElementById("auth-container");
const chatContainer = document.getElementById("chat-container");

const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const toRegister = document.getElementById("to-register");
const toLogin = document.getElementById("to-login");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

const messagesList = document.getElementById("messages-list");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-text");
const signoutBtn = document.getElementById("signout-btn");
const userAvatar = document.getElementById("user-avatar");
const userDisplay = document.getElementById("user-display");

toRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showRegister();
});
toLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

loginBtn.addEventListener("click", signIn);
registerBtn.addEventListener("click", signUp);
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});
signoutBtn.addEventListener("click", signOut);

/* ====== وظائف الانتقال UI ====== */
function showRegister() {
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  loginError.textContent = "";
  registerError.textContent = "";
}
function showLogin() {
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  registerError.textContent = "";
  loginError.textContent = "";
}

/* ====== VALIDATIONS ====== */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isStrongPassword(pw) {
  return pw && pw.length >= 6;
}

/* ====== SIGN UP ====== */
async function signUp() {
  registerError.textContent = "";
  const displayName = document.getElementById("reg-displayname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!displayName || !email || !password) {
    registerError.textContent = "الرجاء ملء جميع الحقول المطلوبة.";
    return;
  }
  if (!isValidEmail(email)) {
    registerError.textContent = "البريد الإلكتروني غير بصيغة صحيحة.";
    return;
  }
  if (!isStrongPassword(password)) {
    registerError.textContent =
      "كلمة المرور ضعيفة — يجب أن تكون 6 أحرف على الأقل.";
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = credential.user;

    await updateProfile(user, { displayName });

    await setDoc(doc(db, "users", user.uid), {
      email,
      displayName,
      phoneNumber: phone || null,
      createdAt: serverTimestamp(),
      role: "user",
    });

    document.getElementById("reg-displayname").value = "";
    document.getElementById("reg-email").value = "";
    document.getElementById("reg-phone").value = "";
    document.getElementById("reg-password").value = "";

    console.log("تم التسجيل وتخزين المعلومات.");
  } catch (error) {
    console.error("SignUp error:", error);
    let msg = "حدث خطأ أثناء التسجيل.";
    if (error.code === "auth/email-already-in-use")
      msg = "هذا البريد الإلكتروني مستخدم بالفعل.";
    else if (error.code === "auth/invalid-email")
      msg = "البريد الإلكتروني غير صالح.";
    else if (error.code === "auth/weak-password")
      msg = "كلمة المرور ضعيفة. (٦ أحرف على الأقل)";
    registerError.textContent = msg;
  }
}

/* ====== SIGN IN ====== */
async function signIn() {
  loginError.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    loginError.textContent = "الرجاء ملء البريد وكلمة المرور.";
    return;
  }
  if (!isValidEmail(email)) {
    loginError.textContent = "صيغة البريد الإلكتروني غير صحيحة.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("SignIn error:", error);
    let msg = "خطأ في البريد أو كلمة المرور.";
    if (error.code === "auth/user-not-found") msg = "لا يوجد حساب بهذا البريد.";
    else if (error.code === "auth/wrong-password")
      msg = "كلمة المرور غير صحيحة.";
    loginError.textContent = msg;
  }
}

/* ====== SIGN OUT ====== */
function signOut() {
  firebaseSignOut(auth).catch((err) => console.error("SignOut err:", err));
}

/* ====== CHAT: إرسال رسالة ====== */
async function sendMessage() {
  const text = messageInput.value.trim();
  const user = auth.currentUser;
  if (!user) return;

  if (!text) {
    messageInput.placeholder = "اكتب شيئًا لإرساله...";
    setTimeout(() => (messageInput.placeholder = "اكتب رسالتك هنا..."), 1500);
    return;
  }

  try {
    const chatCol = collection(db, "general-chat");
    await addDoc(chatCol, {
      text,
      senderUid: user.uid,
      senderName: user.displayName || "مستخدم",
      timestamp: serverTimestamp(),
    });
    messageInput.value = "";
  } catch (err) {
    console.error("sendMessage error:", err);
    messageInput.placeholder = "فشل الإرسال. تحقق من الاتصال.";
    setTimeout(() => (messageInput.placeholder = "اكتب رسالتك هنا..."), 2000);
  }
}

/* ====== LISTENER: عرض الرسائل فورياً ====== */
let unsubscribe = null;
function setupChatListener() {
  if (unsubscribe) unsubscribe();

  const q = query(collection(db, "general-chat"), orderBy("timestamp", "asc"));
  unsubscribe = onSnapshot(
    q,
    (snap) => {
      messagesList.innerHTML = "";
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const senderUid = data.senderUid || "";
        const senderName = data.senderName || "مستخدم";
        const text = data.text || "";
        const ts = data.timestamp
          ? data.timestamp.toDate
            ? data.timestamp.toDate()
            : new Date(data.timestamp)
          : null;

        let timeStr = "الآن";
        if (ts) {
          const opts = { hour: "2-digit", minute: "2-digit" };
          timeStr = ts.toLocaleTimeString("ar-EG", opts);
        }

        const row = document.createElement("div");
        row.className = "msg-row";
        const isMe = auth.currentUser && auth.currentUser.uid === senderUid;

        const avatar = document.createElement("div");
        avatar.className = "avatar-xs";
        avatar.textContent = senderName
          ? senderName.charAt(0).toUpperCase()
          : "?";

        const bubble = document.createElement("div");
        bubble.className = "msg " + (isMe ? "msg-me" : "msg-other");

        const meta = document.createElement("div");
        meta.className = "meta";
        const nameSpan = document.createElement("span");
        nameSpan.className = "name";
        nameSpan.textContent = isMe ? "أنت" : senderName;
        const timeSpan = document.createElement("span");
        timeSpan.className = "time";
        timeSpan.textContent = timeStr;

        meta.appendChild(nameSpan);
        meta.appendChild(timeSpan);

        const textDiv = document.createElement("div");
        textDiv.className = "text";
        textDiv.textContent = text;

        bubble.appendChild(meta);
        bubble.appendChild(textDiv);

        if (isMe) {
          row.style.justifyContent = "flex-start";
          row.appendChild(avatar);
          row.appendChild(bubble);
        } else {
          row.style.justifyContent = "flex-end";
          row.appendChild(bubble);
          row.appendChild(avatar);
        }

        messagesList.appendChild(row);
      });
      messagesList.scrollTop = messagesList.scrollHeight;
    },
    (err) => {
      console.error("Snapshot error:", err);
    }
  );
}

/* ====== Auth state observer ====== */
onAuthStateChanged(auth, (user) => {
  if (user) {
    authContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");

    const name = user.displayName || "مستخدم";
    userDisplay.textContent = name;
    userAvatar.textContent = name.charAt(0).toUpperCase();

    setupChatListener();
  } else {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    chatContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
    showLogin();
  }
});

/* ====== تصدير وظائف للعناصر (في حال الحاجة من ال HTML) ====== */
window.showRegister = showRegister;
window.showLogin = showLogin;
window.signIn = signIn;
window.signUp = signUp;
window.signOut = signOut;
window.sendMessage = sendMessage;
