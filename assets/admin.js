import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, CERTIFICATES_BUCKET } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginView  = document.getElementById("login-view");
const adminView  = document.getElementById("admin-view");
const toastEl    = document.getElementById("toast");

function toast(msg, type = "ok") {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.classList.remove("show"), 3200);
}

// ---------------- AUTH ----------------
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    loadProjectList();
    loadCertList();
  } else {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
  }
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) {
    toast("Please enter both email and password.", "err");
    return;
  }
  const btn = document.getElementById("login-btn");
  btn.textContent = "Authenticating Clearance...";
  btn.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  btn.textContent = "Authenticate Clearance →";
  btn.disabled = false;

  if (error) {
    toast(error.message, "err");
    return;
  }
  toast("Clearance Granted // Welcome to Batcomputer", "ok");
  checkSession();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  toast("Terminal Locked", "ok");
  checkSession();
});

checkSession();

// ---------------- PROJECTS ----------------
const projectForm = document.getElementById("project-form");

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("p-submit-btn");
  submitBtn.textContent = "Committing to Vault...";
  submitBtn.disabled = true;

  const payload = {
    title: document.getElementById("p-title").value.trim(),
    status: document.getElementById("p-status").value,
    sort_order: Number(document.getElementById("p-order").value) || 0,
    description: document.getElementById("p-desc").value.trim(),
    highlights: document.getElementById("p-highlights").value
      .split("\n").map(s => s.trim()).filter(Boolean),
    tags: document.getElementById("p-tags").value
      .split(",").map(s => s.trim()).filter(Boolean),
    repo_url: document.getElementById("p-repo").value.trim() || null,
    demo_url: document.getElementById("p-demo").value.trim() || null,
  };

  const { error } = await supabase.from("projects").insert(payload);
  submitBtn.textContent = "Commit Case to Database →";
  submitBtn.disabled = false;

  if (error) {
    toast(error.message, "err");
    return;
  }
  toast("Case file saved successfully!", "ok");
  projectForm.reset();
  loadProjectList();
});

async function loadProjectList() {
  const listEl = document.getElementById("project-list");
  const { data, error } = await supabase.from("projects").select("*").order("sort_order");
  if (error) {
    listEl.innerHTML = `<p style="color:var(--bat-red)">${error.message}</p>`;
    return;
  }
  if (!data.length) {
    listEl.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No case files registered in vault yet.</p>`;
    return;
  }
  listEl.innerHTML = data.map(p => `
    <div class="list-item">
      <div>
        <strong>${p.title}</strong>
        <div class="meta">${(p.tags || []).join(" · ")}</div>
      </div>
      <div class="list-actions">
        <button class="icon-btn danger" data-del-project="${p.id}">Delete</button>
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-del-project]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this case file?")) return;
      const { error } = await supabase.from("projects").delete().eq("id", btn.dataset.delProject);
      if (error) {
        toast(error.message, "err");
        return;
      }
      toast("Case file deleted", "ok");
      loadProjectList();
    });
  });
}

// ---------------- CERTIFICATES ----------------
const certForm = document.getElementById("cert-form");

certForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("c-submit-btn");
  submitBtn.textContent = "Encrypting & Saving...";
  submitBtn.disabled = true;

  const name = document.getElementById("c-name").value.trim();
  const issuer = document.getElementById("c-issuer").value.trim();
  const issue_date = document.getElementById("c-date").value || null;
  const fileInput = document.getElementById("c-file");
  const file = fileInput.files[0];

  let file_url = null;

  if (file) {
    const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from(CERTIFICATES_BUCKET)
      .upload(path, file, { contentType: "application/pdf" });

    if (uploadError) {
      submitBtn.textContent = "Upload & Encrypt Credential →";
      submitBtn.disabled = false;
      toast(`Upload error: ${uploadError.message}`, "err");
      return;
    }
    const { data: publicUrlData } = supabase.storage.from(CERTIFICATES_BUCKET).getPublicUrl(path);
    file_url = publicUrlData.publicUrl;
  }

  const { error } = await supabase.from("certificates").insert({ name, issuer, issue_date, file_url });
  submitBtn.textContent = "Upload & Encrypt Credential →";
  submitBtn.disabled = false;

  if (error) {
    toast(error.message, "err");
    return;
  }
  toast("Clearance encrypted & saved!", "ok");
  certForm.reset();
  loadCertList();
});

async function loadCertList() {
  const listEl = document.getElementById("cert-list");
  const { data, error } = await supabase.from("certificates").select("*").order("issue_date", { ascending: false });
  if (error) {
    listEl.innerHTML = `<p style="color:var(--bat-red)">${error.message}</p>`;
    return;
  }
  if (!data.length) {
    listEl.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No credentials in vault yet.</p>`;
    return;
  }
  listEl.innerHTML = data.map(c => `
    <div class="list-item">
      <div>
        <strong>${c.name}</strong>
        <div class="meta">${c.issuer || "No issuer"} ${c.issue_date ? "· " + c.issue_date : ""}</div>
      </div>
      <div class="list-actions">
        ${c.file_url ? `<a class="icon-btn" href="${c.file_url}" target="_blank" rel="noopener">View PDF ↗</a>` : ""}
        <button class="icon-btn danger" data-del-cert="${c.id}">Delete</button>
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-del-cert]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete this credential?")) return;
      const { error } = await supabase.from("certificates").delete().eq("id", btn.dataset.delCert);
      if (error) {
        toast(error.message, "err");
        return;
      }
      toast("Credential deleted", "ok");
      loadCertList();
    });
  });
}
