const feedEl = document.getElementById("feed");
const userBadge = document.getElementById("userBadge");

let currentUser = null;

function formatTime(value) {
  const date = new Date(value.replace(" ", "T") + "Z");
  return date.toLocaleString();
}

function getAvatarUrl(avatarUrl) {
  if (avatarUrl) return avatarUrl;
  return `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#94a3b8"/><text x="20" y="28" font-family="Arial" font-size="20" fill="white" text-anchor="middle">?</text></svg>'
  )}`;
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this post?")) {
    return;
  }
  const res = await fetch(`/api/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.ok) {
    loadPosts();
  } else {
    alert("Failed to delete post");
  }
}

function renderPosts(posts) {
  feedEl.innerHTML = "";
  if (!posts.length) {
    feedEl.innerHTML = `
      <div class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        No posts yet. Be the first to share something!
      </div>
    `;
    return;
  }
  posts.forEach((post) => {
    const card = document.createElement("div");
    card.className =
      "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900";
    const canDelete = currentUser && post.authorId === currentUser.id;
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img
            src="${getAvatarUrl(post.authorAvatar)}"
            alt="${post.author}"
            class="h-10 w-10 rounded-full border-2 border-slate-200 object-cover dark:border-slate-700"
          />
          <div>
            <p class="font-semibold">${post.author}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">${formatTime(
              post.createdAt
            )}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          ${canDelete ? `
            <button
              onclick="deletePost(${post.id})"
              class="rounded-full p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              type="button"
              title="Delete post"
            >
              <i class="fas fa-trash text-xs"></i>
            </button>
          ` : ""}
          <form action="/api/posts/${post.id}/like" method="post" class="inline">
            <button
              type="submit"
              class="rounded-full border border-slate-200 px-3 py-1 text-xs ${
                post.likedByMe ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30" : ""
              } dark:border-slate-700"
            >
              👍 ${post.likes}
            </button>
          </form>
        </div>
      </div>
      <p class="mt-3 text-sm leading-relaxed">${post.content}</p>
      <form action="/api/posts" method="post" class="mt-4 flex flex-col gap-2">
        <input type="hidden" name="parentId" value="${post.id}" />
        <textarea
          name="content"
          class="min-h-[80px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          placeholder="Write a reply..."
          maxlength="500"
          required
        ></textarea>
        <div class="flex justify-end">
          <button class="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white" type="submit">
            Reply
          </button>
        </div>
      </form>
      <div class="mt-4 space-y-3">
        ${post.replies
          .map(
            (reply) => {
              const canDeleteReply = currentUser && reply.authorId === currentUser.id;
              return `
                <div class="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <img
                        src="${getAvatarUrl(reply.authorAvatar)}"
                        alt="${reply.author}"
                        class="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                      />
                      <p class="font-medium">${reply.author}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      ${canDeleteReply ? `
                        <button
                          onclick="deletePost(${reply.id})"
                          class="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          type="button"
                          title="Delete comment"
                        >
                          <i class="fas fa-trash text-xs"></i>
                        </button>
                      ` : ""}
                      <span class="text-xs text-slate-500 dark:text-slate-400">
                        ${formatTime(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p class="mt-2">${reply.content}</p>
                </div>
              `;
            }
          )
          .join("")}
      </div>
    `;
    feedEl.appendChild(card);
  });
}

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

async function loadPosts() {
  const res = await fetch("/api/posts", { credentials: "include" });
  const data = await res.json();
  currentUser = data.user;
  if (currentUser) {
    userBadge.innerHTML = `
      <div class="relative">
        <button
          id="userMenuButton"
          class="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          type="button"
        >
          <img
            src="${getAvatarUrl(currentUser.avatar_url)}"
            alt="${currentUser.username}"
            class="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
          />
        </button>
        <div
          id="userMenuDropdown"
          class="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 hidden z-50"
        >
          <div class="p-2">
            <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">${currentUser.username}</p>
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
  } else {
    userBadge.innerHTML = `
      <a href="/login" class="text-sm text-blue-600 hover:underline">Sign in</a>
    `;
  }
  renderPosts(data.posts || []);
}

// Make deletePost available globally for onclick handlers
window.deletePost = deletePost;

loadPosts();
