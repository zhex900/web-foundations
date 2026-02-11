const userBadge = document.getElementById("userBadge");
const message = document.getElementById("message");
const usernameInput = document.getElementById("username");
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatarPreview");

function getAvatarUrl(avatarUrl) {
  if (avatarUrl) return avatarUrl;
  return `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#94a3b8"/><text x="20" y="28" font-family="Arial" font-size="20" fill="white" text-anchor="middle">?</text></svg>'
  )}`;
}

avatarInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      avatarPreview.src = event.target.result;
      avatarPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }
});

function initUserMenu() {
  const menuButton = userBadge.querySelector("#userMenuButton");
  const menuDropdown = userBadge.querySelector("#userMenuDropdown");
  
  if (!menuButton || !menuDropdown) return;
  
  let isOpen = false;
  
  function toggleMenu() {
    isOpen = !isOpen;
    menuDropdown.classList.toggle("hidden", !isOpen);
  }
  
  function closeMenu() {
    isOpen = false;
    menuDropdown.classList.add("hidden");
  }
  
  // Click handler
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });
  
  // Hover handlers
  userBadge.addEventListener("mouseenter", () => {
    if (!isOpen) {
      menuDropdown.classList.remove("hidden");
    }
  });
  
  userBadge.addEventListener("mouseleave", () => {
    if (!isOpen) {
      menuDropdown.classList.add("hidden");
    }
  });
  
  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!userBadge.contains(e.target)) {
      closeMenu();
    }
  });
}

async function loadProfile() {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) {
    window.location.href = "/login";
    return;
  }
  const data = await res.json();
  if (data.user) {
    usernameInput.value = data.user.username;
    if (data.user.avatar_url) {
      avatarPreview.src = data.user.avatar_url;
      avatarPreview.style.display = "block";
    }
    userBadge.innerHTML = `
      <div class="relative">
        <button
          id="userMenuButton"
          class="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          type="button"
        >
          <img
            src="${getAvatarUrl(data.user.avatar_url)}"
            alt="${data.user.username}"
            class="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
          />
        </button>
        <div
          id="userMenuDropdown"
          class="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 hidden z-50"
        >
          <div class="p-2">
            <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">${data.user.username}</p>
            </div>
            <a
              href="/profile"
              class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded"
            >
              <i class="fas fa-user w-4"></i>
              Profile
            </a>
            <form action="/api/logout" method="post" class="block">
              <button
                type="submit"
                class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
              >
                <i class="fas fa-sign-out-alt w-4"></i>
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
    initUserMenu();
  }
}

const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get("error");
const success = urlParams.get("success");

if (error === "username_taken") {
  message.innerHTML = `
    <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      Username is already taken. Please choose another.
    </div>
  `;
} else if (error === "current_password_required") {
  message.innerHTML = `
    <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      Current password is required to change your password.
    </div>
  `;
} else if (error === "invalid_password") {
  message.innerHTML = `
    <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
      Current password is incorrect.
    </div>
  `;
} else if (success === "updated") {
  message.innerHTML = `
    <div class="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
      Profile updated successfully!
    </div>
  `;
}

loadProfile();
