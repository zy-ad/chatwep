// تحديث مسارات استيراد Firebase لأحدث إصدار (مثل 10.x.x)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// تهيئة Firebase
// !!! ملاحظة هامة جداً: لا تقم بتضمين مفتاح API (apiKey) مباشرة في شيفرة العميل المصدرية
// للتطبيقات الإنتاجية. هذا يعرضه للعامة. استخدم متغيرات البيئة
// (مثل Firebase Hosting environment variables) أو Firebase Functions لإخفاءه.
// لأغراض التطوير والاختبار المحلي، يمكن استخدامه، ولكن كن حذراً.
const firebaseConfig = {
  apiKey: "AIzaSyCHgPyMNy7puBLsxIJNgc51Y7YJMaHAOoI", // استبدل هذا بمفتاح API الخاص بك
  authDomain: "wep-zyad.firebaseapp.com",
  projectId: "wep-zyad",
  storageBucket: "wep-zyad.appspot.com",
  messagingSenderId: "197850687110",
  appId: "1:197850687110:web:86ed3244f7c9f60cd01307",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// عناصر الـ DOM
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const authContainer = document.getElementById("auth-container");
const chatContainer = document.getElementById("chat-container");

const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const toRegisterLink = document.getElementById("to-register");
const toLoginLink = document.getElementById("to-login");

const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

const messagesList = document.getElementById("messages-list");
const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-text");
const signoutBtn = document.getElementById("signout-btn");
const chatChannelNameElement = document.getElementById("chat-channel-name");

// تبديل واجهات المصادقة
const clearAuthErrors = () => {
  loginError.textContent = "";
  registerError.textContent = "";
};

toRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
  clearAuthErrors(); // مسح الأخطاء عند التبديل
});

toLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
  clearAuthErrors(); // مسح الأخطاء عند التبديل
});

// وظائف التحقق من الصحة
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pw) => pw && pw.length >= 6;
const isValidDisplayName = (name) => name && name.trim().length > 2; // يجب أن يكون الاسم 3 أحرف على الأقل

// التسجيل (Sign Up)
registerBtn.addEventListener("click", async () => {
  clearAuthErrors(); // مسح الأخطاء السابقة
  const displayName = document.getElementById("reg-displayname").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!isValidDisplayName(displayName)) {
    registerError.textContent = "الرجاء إدخال اسم عرض صالح (3 أحرف على الأقل).";
    return;
  }
  if (!email || !password) {
    registerError.textContent =
      "الرجاء ملء حقول البريد الإلكتروني وكلمة المرور.";
    return;
  }
  if (!isValidEmail(email)) {
    registerError.textContent = "صيغة البريد الإلكتروني غير صالحة.";
    return;
  }
  if (!isStrongPassword(password)) {
    registerError.textContent = "كلمة المرور ضعيفة جداً (6 أحرف على الأقل).";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: displayName,
    });

    // حفظ بيانات المستخدم في Firestore
    await setDoc(doc(db, "users", user.uid), {
      displayName: displayName,
      email: email,
      createdAt: serverTimestamp(),
    });

    console.log("تم التسجيل بنجاح! المستخدم:", user.displayName);
  } catch (err) {
    console.error("خطأ في التسجيل:", err.code, err.message);
    if (err.code === "auth/email-already-in-use") {
      registerError.textContent = "هذا البريد الإلكتروني مستخدم بالفعل.";
    } else if (err.code === "auth/weak-password") {
      registerError.textContent = "كلمة المرور ضعيفة جداً.";
    } else {
      registerError.textContent = `حدث خطأ أثناء التسجيل: ${err.message}`;
    }
  }
});

// تسجيل الدخول (Sign In)
loginBtn.addEventListener("click", async () => {
  clearAuthErrors(); // مسح الأخطاء السابقة
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    loginError.textContent = "الرجاء ملء حقول البريد الإلكتروني وكلمة المرور.";
    return;
  }
  if (!isValidEmail(email)) {
    loginError.textContent = "صيغة البريد الإلكتروني غير صالحة.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("تم تسجيل الدخول بنجاح!");
  } catch (err) {
    console.error("خطأ في تسجيل الدخول:", err.code, err.message);
    if (err.code === "auth/user-not-found") {
      loginError.textContent = "لا يوجد مستخدم بهذا البريد الإلكتروني.";
    } else if (err.code === "auth/wrong-password") {
      loginError.textContent = "كلمة المرور غير صحيحة.";
    } else if (err.code === "auth/invalid-email") {
      loginError.textContent = "صيغة البريد الإلكتروني غير صحيحة.";
    } else {
      loginError.textContent = `حدث خطأ أثناء تسجيل الدخول: ${err.message}`;
    }
  }
});

// تسجيل الخروج (Sign Out)
signoutBtn.addEventListener("click", () => {
  firebaseSignOut(auth)
    .then(() => {
      console.log("تم تسجيل الخروج بنجاح.");
      // عند تسجيل الخروج، يجب مسح الرسائل المعروضة
      messagesList.innerHTML = "";
    })
    .catch((error) => {
      console.error("خطأ في تسجيل الخروج:", error);
    });
});

// إرسال رسالة
sendBtn.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  const user = auth.currentUser;

  if (!text || !user) {
    return; // لا ترسل إذا كانت الرسالة فارغة أو لا يوجد مستخدم
  }

  // تعطيل زر الإرسال مؤقتاً لمنع الإرسال المتعدد
  sendBtn.disabled = true;

  try {
    await addDoc(collection(db, "general-chat"), {
      text: text,
      senderUid: user.uid,
      senderName: user.displayName || "مستخدم مجهول",
      timestamp: serverTimestamp(),
    });
    messageInput.value = ""; // مسح حقل الإدخال
    messageInput.style.height = "auto"; // إعادة ضبط ارتفاع الـ textarea
    sendBtn.disabled = true; // تعطيل الزر مرة أخرى لأن حقل الإدخال أصبح فارغاً
  } catch (error) {
    console.error("خطأ في إرسال الرسالة:", error);
    // يمكن عرض رسالة خطأ للمستخدم هنا
  } finally {
    // التأكد من تفعيل الزر في حالة حدوث خطأ أو اكتمال الإرسال
    if (messageInput.value.trim() !== "") {
      sendBtn.disabled = false;
    }
  }
});

// مراقبة الرسائل في المحادثة العامة (Chat Listener)
let unsubscribeFromChat = null;

// دالة مساعدة لتنسيق التاريخ والوقت
function formatMessageTimestamp(timestamp) {
  if (!timestamp || !timestamp.toDate) {
    return "الآن";
  }

  const messageDate = timestamp.toDate();
  const now = new Date();

  // خيارات التنسيق للوقت
  const timeOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // استخدام تنسيق 12 ساعة (ص/م)
  };
  const formattedTime = messageDate.toLocaleTimeString("ar-EG", timeOptions);

  // إذا كانت الرسالة اليوم
  if (
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear()
  ) {
    return formattedTime;
  }

  // إذا كانت الرسالة أمس
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `أمس، ${formattedTime}`;
  }

  // إذا كانت الرسالة أقدم من أمس
  const dateOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  };
  const formattedDate = messageDate.toLocaleDateString("ar-EG", dateOptions);

  return `${formattedDate}، ${formattedTime}`;
}

function setupChatListener() {
  if (unsubscribeFromChat) {
    unsubscribeFromChat(); // إلغاء الاشتراك السابق إذا كان موجوداً
    unsubscribeFromChat = null;
  }

  const q = query(collection(db, "general-chat"), orderBy("timestamp", "asc"));

  unsubscribeFromChat = onSnapshot(q, (snapshot) => {
    // لتجنب وميض الشاشة، يمكننا تحديث الرسائل الموجودة فقط
    // أو إعادة بناء القائمة إذا كانت التغييرات جوهرية
    messagesList.innerHTML = ""; // إعادة بناء كاملة لتسهيل العرض

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const currentUser = auth.currentUser;
      const isMe = currentUser && currentUser.uid === data.senderUid;

      const messageItem = document.createElement("div");
      messageItem.classList.add("message-item");
      if (isMe) {
        messageItem.classList.add("my-message"); // إضافة فئة لرسائل المستخدم الحالي
      }

      const avatarPlaceholder = document.createElement("div");
      avatarPlaceholder.classList.add("message-avatar-placeholder");
      // يمكنك هنا تعيين صورة الرمزية من بيانات المستخدم إذا كانت متوفرة
      // avatarPlaceholder.style.backgroundImage = `url(${data.senderPhotoURL || 'default-avatar.png'})`;
      // يمكنك عرض الحرف الأول من اسم المستخدم هنا
      avatarPlaceholder.textContent = data.senderName
        ? data.senderName.charAt(0)
        : "?";

      const messageContent = document.createElement("div");
      messageContent.classList.add("message-content");

      const messageHeader = document.createElement("div");
      messageHeader.classList.add("message-header");

      const senderNameSpan = document.createElement("span");
      senderNameSpan.classList.add("message-sender-name");
      senderNameSpan.textContent = isMe ? "أنت" : data.senderName;

      const timestampSpan = document.createElement("span");
      timestampSpan.classList.add("message-timestamp");
      // استخدام الدالة الجديدة لتنسيق الوقت والتاريخ
      timestampSpan.textContent = formatMessageTimestamp(data.timestamp);

      messageHeader.appendChild(senderNameSpan);
      messageHeader.appendChild(timestampSpan);

      const messageTextDiv = document.createElement("div");
      messageTextDiv.classList.add("message-text");
      messageTextDiv.textContent = data.text;

      messageContent.appendChild(messageHeader);
      messageContent.appendChild(messageTextDiv);

      // ترتيب العناصر داخل الرسالة يعتمد على ما إذا كانت رسالتي أم لا
      if (isMe) {
        messageItem.appendChild(messageContent);
        messageItem.appendChild(avatarPlaceholder);
      } else {
        messageItem.appendChild(avatarPlaceholder);
        messageItem.appendChild(messageContent);
      }

      messagesList.appendChild(messageItem);
    });

    // التمرير إلى الأسفل بعد تحديث الرسائل
    messagesList.scrollTop = messagesList.scrollHeight;
  });
}

// مراقبة حالة المصادقة (Auth State)
onAuthStateChanged(auth, (user) => {
  if (user) {
    authContainer.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    // عرض اسم القناة كما هو في الـ HTML
    chatChannelNameElement.textContent = "المحادثة العامة";
    setupChatListener(); // بدء الاستماع للرسائل
  } else {
    // إذا لم يكن هناك مستخدم، إخفاء المحادثة وإظهار شاشة المصادقة
    if (unsubscribeFromChat) {
      unsubscribeFromChat(); // إيقاف الاستماع للرسائل
      unsubscribeFromChat = null;
    }
    chatContainer.classList.add("hidden");
    authContainer.classList.remove("hidden");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    clearAuthErrors(); // مسح أي أخطاء عند تسجيل الخروج
    messagesList.innerHTML = ""; // مسح الرسائل المعروضة
  }
});

// ضبط ارتفاع الـ textarea ديناميكياً
messageInput.addEventListener("input", () => {
  messageInput.style.height = "auto";
  messageInput.style.height = messageInput.scrollHeight + "px";
  // تفعيل/تعطيل زر الإرسال بناءً على وجود نص
  sendBtn.disabled = messageInput.value.trim() === "";
});

// إرسال الرسالة عند الضغط على Enter (Shift + Enter لسطر جديد)
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) {
      sendBtn.click();
    }
  }
});

// تفعيل زر الإرسال في البداية إذا كان هناك نص افتراضي (غير متوقع عادة)
sendBtn.disabled = messageInput.value.trim() === "";
