import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SB_URL = "https://kvldromxgcjqqyzavvaw.supabase.co";
const SB_KEY = "sb_publishable_Y_YuecLpfLS_pTAaUV-qeA_LsxsbHlP";

const getToken = () => {
  try {
    const u = localStorage.getItem("u13");
    if (u) return JSON.parse(u).token || SB_KEY;
  } catch {}
  return SB_KEY;
};

const api = async (method, path, body) => {
  const token = getToken();
  const r = await fetch("${SB_URL}/rest/v1/" + path + "", {
    method,
    headers: {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + token + "",
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "DELETE" || method === "PATCH") {
    if (!r.ok) { const t = await r.text(); console.error(path, t); }
    return null;
  }
  const text = await r.text();
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    if (!r.ok) { console.error(path, data); return null; }
    return data;
  } catch(e) {
    console.error("JSON parse error:", text);
    return null;
  }
};

const db = {
  get: (path) => api("GET", path),
  post: (table, data) => api("POST", table, data),
  patch: (table, id, data) => api("PATCH", "${table}?id=eq." + id + "", data),
  del: (table, id) => api("DELETE", "${table}?id=eq." + id + ""),
  delWhere: (table, col, val) => api("DELETE", "${table}?${col}=eq." + encodeURIComponent(val) + ""),
  delWhereGte: (table, col, val, dateCol, date) => api("DELETE", "${table}?${col}=eq.${encodeURIComponent(val)}&${dateCol}=gte." + date + ""),
};

// ─── DESIGN ───────────────────────────────────────────────────────────────────
const T = {
  // Terrain vert nuit — palette inspirée du football moderne
  bg: "#070D12",
  surface: "#0E1820",
  card: "#131F2B",
  cardHover: "#182636",
  border: "#1E2F40",
  borderLight: "#243850",
  // Accents
  lime: "#C8F135",      // vert citron électrique — le "but"
  limeDim: "#8DB020",
  limeBg: "rgba(200,241,53,0.08)",
  cyan: "#00D4FF",      // cyan — info
  cyanBg: "rgba(0,212,255,0.08)",
  red: "#FF3B5C",
  redBg: "rgba(255,59,92,0.08)",
  amber: "#FFB020",
  amberBg: "rgba(255,176,32,0.08)",
  purple: "#9B5DE5",
  purpleBg: "rgba(155,93,229,0.08)",
  // Texte
  t1: "#F0F6FF",
  t2: "#8BA0B8",
  t3: "#4A6278",
  white: "#FFFFFF",
};

const postes = ["Gardien", "Défenseur", "Milieu", "Attaquant"];
const posteIcon = { Gardien: "🧤", Défenseur: "🛡️", Milieu: "⚙️", Attaquant: "⚡" };
const posteColor = { Gardien: T.amber, Défenseur: T.cyan, Milieu: T.lime, Attaquant: T.red };
const avatarPalette = [T.lime, T.cyan, T.red, T.amber, T.purple, "#FF6B6B", "#4ECDC4", "#45B7D1"];
const getAvatarColor = (s) => avatarPalette[(s?.charCodeAt(0) || 0) % avatarPalette.length];

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Avatar = ({ name = "", size = 40, style }) => {
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = getAvatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: "linear-gradient(135deg," + bg + "," + bg + "88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: T.bg,
      flexShrink: 0, letterSpacing: -0.5, ...style
    }}>{initials || "?"}</div>
  );
};

const Badge = ({ children, color = T.lime, style }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
    color, background: "" + color + "18", border: "1px solid " + color + "30",
    ...style
  }}>{children}</span>
);

const Card = ({ children, style, onClick, glow }) => (
  <div onClick={onClick} style={{
    background: T.card, border: "1px solid " + T.border,
    borderRadius: 16, padding: 16, marginBottom: 10,
    cursor: onClick ? "pointer" : "default",
    transition: "all .15s",
    boxShadow: glow ? "0 0 20px " + glow + "18" : "none",
    ...style
  }}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", size = "md", style, disabled, full }) => {
  const sizes = { sm: "8px 14px", md: "12px 20px", lg: "15px 24px" };
  const fontSizes = { sm: 13, md: 14, lg: 16 };
  const variants = {
    primary: { bg: T.lime, color: T.bg, border: "none" },
    secondary: { bg: T.border, color: T.t1, border: "none" },
    ghost: { bg: "transparent", color: T.t2, border: "1px solid " + T.border },
    danger: { bg: T.redBg, color: T.red, border: "1px solid " + T.red + "30" },
    success: { bg: T.limeBg, color: T.lime, border: "1px solid " + T.lime + "30" },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
      padding: sizes[size], borderRadius: 12,
      fontSize: fontSizes[size], fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      width: full ? "100%" : "auto",
      background: v.bg, color: v.color, border: v.border,
      transition: "all .15s",
      ...style
    }}>{children}</button>
  );
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>}
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <Field label={label}>
    <input style={{
      width: "100%", background: T.surface, border: "1px solid " + T.border,
      borderRadius: 10, padding: "12px 14px", fontSize: 15, color: T.t1,
      outline: "none", transition: "border .15s",
    }}
      onFocus={e => e.target.style.borderColor = T.lime}
      onBlur={e => e.target.style.borderColor = T.border}
      autoComplete="off" autoCorrect="off" spellCheck="false"
      {...props} />
  </Field>
);

const Sel = ({ label, children, ...props }) => (
  <Field label={label}>
    <select style={{
      width: "100%", background: T.surface, border: "1px solid " + T.border,
      borderRadius: 10, padding: "12px 14px", fontSize: 15, color: T.t1,
      outline: "none", colorScheme: "dark",
    }} {...props}>{children}</select>
  </Field>
);

const TA = ({ label, voice, onVoice, ...props }) => (
  <Field label={label}>
    {voice && (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
        <MicBtn onResult={onVoice} />
      </div>
    )}
    <textarea autoComplete="off" autoCorrect="off" style={{
      width: "100%", background: T.surface, border: "1px solid " + T.border,
      borderRadius: 10, padding: "12px 14px", fontSize: 14, color: T.t1,
      outline: "none", minHeight: 80, resize: "vertical", lineHeight: 1.5,
    }} {...props} />
  </Field>
);

const MicBtn = ({ onResult, style }) => {
  const [on, setOn] = useState(false);
  const go = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Utilisez Chrome pour la voix");
    const r = new SR(); r.lang = "fr-FR";
    r.onstart = () => setOn(true);
    r.onend = () => setOn(false);
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.start();
  };
  return (
    <button onClick={go} title="Commande vocale" style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: on ? T.redBg : T.surface,
      border: "1px solid " + on ? T.red : T.border + "",
      cursor: "pointer", fontSize: 16,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: on ? "pulse 1s infinite" : "none", ...style
    }}>{on ? "🔴" : "🎤"}</button>
  );
};

const Drawer = ({ title, onClose, children }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
    zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center",
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: T.card, borderRadius: "20px 20px 0 0",
      padding: 20, width: "100%", maxWidth: 430,
      maxHeight: "92vh", overflowY: "auto",
      border: "1px solid " + T.border, borderBottom: "none",
      animation: "slideUp .2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: T.t1, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</span>
        <button onClick={onClose} style={{ background: T.border, border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: T.t2, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Confirm = ({ msg, onOk, onCancel }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
    <div style={{ background: T.card, borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, border: "1px solid " + T.border }}>
      <div style={{ fontSize: 15, color: T.t1, marginBottom: 20, textAlign: "center", lineHeight: 1.5 }}>{msg}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn full variant="ghost" onClick={onCancel}>Annuler</Btn>
        <Btn full variant="danger" onClick={onOk}>Confirmer</Btn>
      </div>
    </div>
  </div>
);

const Empty = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "48px 20px", color: T.t3 }}>
    <div style={{ fontSize: 44, marginBottom: 12, filter: "grayscale(0.3)" }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 700, color: T.t2, marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>{children}</div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
    <div style={{ width: 28, height: 28, border: "3px solid " + T.border + "", borderTopColor: T.lime, borderRadius: "50%", animation: "spin .7s linear infinite" }} />
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [role, setRole] = useState("educateur");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [reset, setReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const login = async () => {
    if (!email || !pwd) return setErr("Remplissez tous les champs");
    setErr(""); setLoading(true);
    try {
      const r = await fetch("" + SB_URL + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "apikey": SB_KEY,
          "Authorization": "Bearer " + SB_KEY + ""
        },
        body: JSON.stringify({ email, password: pwd })
      });
      const d = await r.json();
      if (d.access_token) {
        const u = { role, email, nom: role === "educateur" ? "Coach" : "Parent", token: d.access_token };
        localStorage.setItem("u13", JSON.stringify(u));
        onLogin(u);
      } else if (d.error_description) {
        setErr(d.error_description);
      } else {
        setErr("Email ou mot de passe incorrect");
      }
    } catch(e) {
      setErr("Erreur de connexion");
    }
    setLoading(false);
  };

  const sendReset = async () => {
    if (!email) return setErr("Entrez votre email");
    setLoading(true);
    await fetch("" + SB_URL + "/auth/v1/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SB_KEY },
      body: JSON.stringify({ email })
    });
    setResetDone(true); setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#003B7A 0%,#1565C0 50%,#F0F4F8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{globalStyles}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: "linear-gradient(135deg, ${T.lime}, " + T.limeDim + ")",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, margin: "0 auto 16px",
          boxShadow: "0 8px 32px " + T.lime + "30"
        }}>⚽</div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: T.t1, letterSpacing: -0.5 }}>U13-USC</div>
        <div style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>USC Colomiers · U13</div>
      </div>

      <div style={{ width: "100%", maxWidth: 380 }}>
        {reset ? (
          <div style={{ background: T.card, borderRadius: 18, padding: 24, border: "1px solid " + T.border }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 16 }}>🔑 Mot de passe oublié</div>
            {resetDone ? (
              <div style={{ background: T.limeBg, border: "1px solid " + T.lime + "30", borderRadius: 10, padding: 14, color: T.lime, fontSize: 14, fontWeight: 600 }}>✅ Email envoyé ! Vérifiez votre boîte.</div>
            ) : (
              <>
                <Input label="Votre email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{err}</div>}
                <Btn full onClick={sendReset} disabled={loading}>{loading ? "Envoi..." : "📧 Envoyer le lien"}</Btn>
              </>
            )}
            <button onClick={() => { setReset(false); setErr(""); setResetDone(false); }} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", marginTop: 14, fontSize: 13, width: "100%", textAlign: "center" }}>← Retour</button>
          </div>
        ) : (
          <div style={{ background: T.card, borderRadius: 18, padding: 24, border: "1px solid " + T.border }}>
            {/* Role switcher */}
            <div style={{ display: "flex", background: T.surface, borderRadius: 12, padding: 4, marginBottom: 20 }}>
              {[["educateur", "👨‍🏫 Éducateur"], ["parent", "👨‍👩‍👧 Parent"]].map(([r, l]) => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex: 1, padding: "10px 8px", borderRadius: 9, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", border: "none", transition: "all .15s",
                  background: role === r ? T.lime : "transparent",
                  color: role === r ? T.bg : T.t2,
                }}>{l}</button>
              ))}
            </div>
            <Input label="Email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <Input label="Mot de passe" type="password" placeholder="••••••••" value={pwd} onChange={e => setPwd(e.target.value)} />
            {err && <div style={{ color: T.red, fontSize: 13, marginBottom: 12, padding: "8px 12px", background: T.redBg, borderRadius: 8 }}>⚠️ {err}</div>}
            <Btn full size="lg" onClick={login} disabled={loading}>{loading ? "⏳ Connexion..." : "Se connecter →"}</Btn>
            <button onClick={() => setReset(true)} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", marginTop: 14, fontSize: 12, width: "100%", textAlign: "center" }}>Mot de passe oublié ?</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ joueurs, events }) {
  const dispo = joueurs.filter(j => !j.blesse);
  const blesses = joueurs.filter(j => j.blesse);
  const upcoming = [...events].sort((a, b) => a.date?.localeCompare(b.date)).slice(0, 4);
  const tColors = { "Entraînement": T.lime, "Match": T.red, "Tournoi": T.amber, "Réunion": T.cyan, "Stage": T.purple };
  const tIcons = { "Entraînement": "🏃", "Match": "⚔️", "Tournoi": "🏆", "Réunion": "📋", "Stage": "🏕️" };

  return (
    <div>
      {/* Hero stats */}
      <div style={{
        background: "linear-gradient(135deg, " + T.surface + " 0%, #0A1520 100%)",
        borderRadius: 18, padding: 20, marginBottom: 14,
        border: "1px solid " + T.border,
        position: "relative", overflow: "hidden"
      }}>
        {/* Pitch lines decoration */}
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, border: "2px solid " + T.lime + "18", borderRadius: "50%" }} />
        <div style={{ position: "absolute", right: 20, top: 20, width: 60, height: 60, border: "1px solid " + T.lime + "10", borderRadius: "50%" }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: T.lime, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>🔵 Saison 2025–2026</div>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { v: dispo.length, l: "Disponibles", c: T.lime },
            { v: blesses.length, l: "Blessés", c: T.red },
            { v: joueurs.length, l: "Effectif", c: T.cyan },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid " + T.border : "none" }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: s.c, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: T.t3, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      <SectionLabel>📅 Programme</SectionLabel>
      {upcoming.length === 0 && <Empty icon="📅" title="Aucun événement" sub="Créez votre calendrier dans Agenda" />}
      {upcoming.map(e => (
        <Card key={e.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: "" + tColors[e.type] || T.lime + "15",
            border: "1px solid " + tColors[e.type] || T.lime + "30",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>{tIcons[e.type] || "📅"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.t1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {e.type === "Match" ? "⚔️ vs " + e.adversaire + "" : e.titre || e.type}
            </div>
            <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{"📅 " + e.date} · ⏰ {e.heure_debut}{e.terrain ? " · 📍 " + e.terrain + "" : ""}</div>
          </div>
          <Badge color={tColors[e.type] || T.lime}>{e.type}</Badge>
        </Card>
      ))}

      {blesses.length > 0 && (
        <>
          <SectionLabel>🚑 Blessés</SectionLabel>
          {blesses.map(j => (
            <Card key={j.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={"${j.prenom} " + j.nom + ""} />
              <div>
                <div style={{ fontWeight: 700 }}>{j.prenom} {j.nom}</div>
                <Badge color={T.red} style={{ marginTop: 4 }}>🚑 Indisponible</Badge>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ─── JOUEUR FORM ──────────────────────────────────────────────────────────────
const emptyJoueur = { nom: "", prenom: "", date_naissance: "", numero_licence: "", poste: "Milieu", poste_secondaire: "", pied: "Droit", taille: "", poids: "", parent1_prenom: "", parent1_nom: "", parent1_telephone: "", parent1_email: "", parent2_prenom: "", parent2_nom: "", parent2_telephone: "", parent2_email: "", infos_medicales: "", allergies: "", notes_educateur: "", actif: true };

function JoueurForm({ form, onChange, onSave, saving, editMode, onClose }) {
  const set = (k) => (e) => onChange({ ...form, [k]: e.target.value });
  return (
    <Drawer title={editMode ? "Modifier le joueur" : "Nouveau joueur"} onClose={onClose}>
      <div style={{ background: T.limeBg, border: "1px solid " + T.lime + "20", borderRadius: 10, padding: 10, marginBottom: 16, fontSize: 12, color: T.lime, fontWeight: 600 }}>⚽ Informations du joueur</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Prénom *" value={form.prenom} onChange={set("prenom")} placeholder="Prénom" />
        <Input label="Nom *" value={form.nom} onChange={set("nom")} placeholder="Nom" />
      </div>
      <Input label="Date de naissance" type="date" value={form.date_naissance} onChange={set("date_naissance")} />
      <Input label="Numéro de licence FFF" value={form.numero_licence} onChange={set("numero_licence")} placeholder="123456789" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Sel label="Poste principal" value={form.poste} onChange={set("poste")}>
          {postes.map(p => <option key={p}>{p}</option>)}
        </Sel>
        <Sel label="Poste secondaire" value={form.poste_secondaire} onChange={set("poste_secondaire")}>
          <option value="">—</option>
          {postes.map(p => <option key={p}>{p}</option>)}
        </Sel>
      </div>
      <Sel label="Pied fort" value={form.pied} onChange={set("pied")}>
        {["Droit", "Gauche", "Les deux"].map(p => <option key={p}>{p}</option>)}
      </Sel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Taille (cm)" type="number" value={form.taille} onChange={set("taille")} />
        <Input label="Poids (kg)" type="number" value={form.poids} onChange={set("poids")} />
      </div>

      <div style={{ background: T.cyanBg, border: "1px solid " + T.cyan + "20", borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 12, color: T.cyan, fontWeight: 600 }}>👨‍👩‍👧 Parent 1</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Prénom" value={form.parent1_prenom} onChange={set("parent1_prenom")} placeholder="Prénom" />
        <Input label="Nom" value={form.parent1_nom} onChange={set("parent1_nom")} placeholder="Nom" />
      </div>
      <Input label="Téléphone" type="tel" value={form.parent1_telephone} onChange={set("parent1_telephone")} placeholder="06 00 00 00 00" />
      <Input label="Email" type="email" value={form.parent1_email} onChange={set("parent1_email")} placeholder="parent@email.com" />

      <div style={{ background: T.cyanBg, border: "1px solid " + T.cyan + "20", borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 12, color: T.cyan, fontWeight: 600 }}>👨‍👩‍👧 Parent 2 (optionnel)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Input label="Prénom" value={form.parent2_prenom} onChange={set("parent2_prenom")} placeholder="Prénom" />
        <Input label="Nom" value={form.parent2_nom} onChange={set("parent2_nom")} placeholder="Nom" />
      </div>
      <Input label="Téléphone" type="tel" value={form.parent2_telephone} onChange={set("parent2_telephone")} placeholder="06 00 00 00 00" />
      <Input label="Email" type="email" value={form.parent2_email} onChange={set("parent2_email")} placeholder="parent2@email.com" />

      <div style={{ background: T.redBg, border: "1px solid " + T.red + "20", borderRadius: 10, padding: 10, marginBottom: 14, fontSize: 12, color: T.red, fontWeight: 600 }}>🩺 Médical</div>
      <Input label="Informations médicales" value={form.infos_medicales} onChange={set("infos_medicales")} placeholder="Asthme, traitement en cours..." />
      <Input label="Allergies ⚠️" value={form.allergies} onChange={set("allergies")} placeholder="Arachides, latex, médicaments..." />

      <Field label="Notes éducateur (privées)">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <textarea autoComplete="off" style={{ flex: 1, background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: T.t1, outline: "none", minHeight: 70, resize: "vertical" }} value={form.notes_educateur} onChange={set("notes_educateur")} placeholder="Notes privées..." />
          <MicBtn onResult={t => onChange({ ...form, notes_educateur: form.notes_educateur + " " + t })} />
        </div>
      </Field>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <Btn full variant="ghost" onClick={onClose}>Annuler</Btn>
        <Btn full onClick={onSave} disabled={saving || !form.nom.trim() || !form.prenom.trim()}>
          {saving ? "⏳ Sauvegarde..." : editMode ? "✅ Modifier" : "✅ Enregistrer"}
        </Btn>
      </div>
    </Drawer>
  );
}

// ─── JOUEURS ─────────────────────────────────────────────────────────────────
function Joueurs() {
  const [joueurs, setJoueurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPoste, setFilterPoste] = useState("Tous");
  const [form, setForm] = useState(emptyJoueur);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.get("joueurs?actif=eq.true&order=nom.asc");
    setJoueurs(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom.trim() || !form.prenom.trim()) return alert("Nom et prénom obligatoires");
    setSaving(true);
    // Clean empty date/number fields to avoid Supabase type errors
    const clean = { ...form };
    if (!clean.date_naissance) delete clean.date_naissance;
    if (!clean.taille) delete clean.taille; else clean.taille = parseFloat(clean.taille);
    if (!clean.poids) delete clean.poids; else clean.poids = parseFloat(clean.poids);
    if (editMode && selected) {
      await db.patch("joueurs", selected.id, clean);
      setSelected({ ...selected, ...clean });
    } else {
      await db.post("joueurs", { ...clean, actif: true });
    }
    setShowForm(false); setEditMode(false); setForm(emptyJoueur);
    await load(); setSaving(false);
  };

  const archive = async () => {
    await db.patch("joueurs", selected.id, { actif: false });
    setSelected(null); setConfirmDel(false); load();
  };

  const openEdit = () => {
    const j = selected;
    setForm({ nom: j.nom || "", prenom: j.prenom || "", date_naissance: j.date_naissance || "", numero_licence: j.numero_licence || "", poste: j.poste || "Milieu", poste_secondaire: j.poste_secondaire || "", pied: j.pied || "Droit", taille: j.taille || "", poids: j.poids || "", parent1_prenom: j.parent1_prenom || "", parent1_nom: j.parent1_nom || "", parent1_telephone: j.parent1_telephone || "", parent1_email: j.parent1_email || "", parent2_prenom: j.parent2_prenom || "", parent2_nom: j.parent2_nom || "", parent2_telephone: j.parent2_telephone || "", parent2_email: j.parent2_email || "", infos_medicales: j.infos_medicales || "", allergies: j.allergies || "", notes_educateur: j.notes_educateur || "", actif: true });
    setEditMode(true); setShowForm(true);
  };

  const filtered = joueurs.filter(j => {
    const ms = "${j.prenom} " + j.nom + "".toLowerCase().includes(search.toLowerCase());
    const mp = filterPoste === "Tous" || j.poste === filterPoste;
    return ms && mp;
  });

  if (selected) {
    const j = selected;
    return (
      <div>
        {confirmDel && <Confirm msg={"Archiver ${j.prenom} " + j.nom + " ?"} onOk={archive} onCancel={() => setConfirmDel(false)} />}
        {showForm && <JoueurForm form={form} onChange={setForm} onSave={save} saving={saving} editMode={editMode} onClose={() => { setShowForm(false); setEditMode(false); setForm(emptyJoueur); }} />}

        <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Retour</button>

        <Card style={{ background: "linear-gradient(135deg, ${getAvatarColor(j.prenom)}15 0%, " + T.card + " 60%)", border: "1px solid " + getAvatarColor(j.prenom) + "25" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <Avatar name={"${j.prenom} " + j.nom + ""} size={64} />
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: T.t1 }}>{j.prenom} {j.nom}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                {j.poste && <Badge color={posteColor[j.poste] || T.lime}>{posteIcon[j.poste]} {j.poste}</Badge>}
                {j.numero_licence && <Badge color={T.cyan}>🪪 {j.numero_licence}</Badge>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn full size="sm" variant="ghost" onClick={openEdit}>✏️ Modifier</Btn>
            <Btn full size="sm" variant="danger" onClick={() => setConfirmDel(true)}>🗃️ Archiver</Btn>
          </div>
        </Card>

        <Card>
          <SectionLabel>Infos</SectionLabel>
          {[["Naissance", j.date_naissance || "—"], ["Pied fort", j.pied || "—"], ["Poste 2", j.poste_secondaire || "—"], ["Taille", j.taille ? "" + j.taille + " cm" : "—"], ["Poids", j.poids ? "" + j.poids + " kg" : "—"]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid " + T.border, fontSize: 14 }}>
              <span style={{ color: T.t3 }}>{k}</span>
              <span style={{ fontWeight: 600, color: T.t1 }}>{v}</span>
            </div>
          ))}
        </Card>

        {(j.parent1_nom || j.parent1_telephone) && (
          <Card>
            <SectionLabel>Contacts parents</SectionLabel>
            <div style={{ marginBottom: j.parent2_nom ? 12 : 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{j.parent1_prenom} {j.parent1_nom}</div>
              {j.parent1_telephone && <div style={{ color: T.t3, fontSize: 13, marginTop: 3 }}>📞 <a href={"tel:" + j.parent1_telephone + ""} style={{ color: T.cyan }}>{j.parent1_telephone}</a></div>}
              {j.parent1_email && <div style={{ color: T.t3, fontSize: 13 }}>✉️ {j.parent1_email}</div>}
            </div>
            {j.parent2_nom && <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{j.parent2_prenom} {j.parent2_nom}</div>
              {j.parent2_telephone && <div style={{ color: T.t3, fontSize: 13, marginTop: 3 }}>📞 <a href={"tel:" + j.parent2_telephone + ""} style={{ color: T.cyan }}>{j.parent2_telephone}</a></div>}
            </div>}
          </Card>
        )}

        {(j.infos_medicales || j.allergies) && (
          <Card style={{ border: "1px solid " + T.red + "25" }}>
            <SectionLabel>Médical</SectionLabel>
            {j.infos_medicales && <p style={{ margin: "0 0 8px", fontSize: 14, color: T.t2 }}>{j.infos_medicales}</p>}
            {j.allergies && <p style={{ margin: 0, fontSize: 14, color: T.red, fontWeight: 700 }}>⚠️ Allergies : {j.allergies}</p>}
          </Card>
        )}

        {j.notes_educateur && (
          <Card>
            <SectionLabel>Notes éducateur</SectionLabel>
            <p style={{ margin: 0, fontSize: 14, color: T.t2, lineHeight: 1.6 }}>{j.notes_educateur}</p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      {showForm && <JoueurForm form={form} onChange={setForm} onSave={save} saving={saving} editMode={editMode} onClose={() => { setShowForm(false); setForm(emptyJoueur); }} />}

      <Btn full style={{ marginBottom: 14 }} onClick={() => { setForm(emptyJoueur); setEditMode(false); setShowForm(true); }}>+ Ajouter un joueur</Btn>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..." style={{ width: "100%", background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: "11px 14px", fontSize: 15, color: T.t1, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {["Tous", ...postes].map(p => (
          <button key={p} onClick={() => setFilterPoste(p)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, border: "1px solid " + filterPoste === p ? (posteColor[p] || T.lime) : T.border + "", background: filterPoste === p ? "" + posteColor[p] || T.lime + "15" : "transparent", color: filterPoste === p ? (posteColor[p] || T.lime) : T.t3 }}>{p}</button>
        ))}
      </div>

      {loading && <Spinner />}
      {!loading && filtered.length === 0 && <Empty icon="👥" title="Aucun joueur" sub="Ajoutez votre effectif pour commencer" />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map(j => (
          <Card key={j.id} style={{ margin: 0, cursor: "pointer" }} onClick={() => setSelected(j)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <Avatar name={"${j.prenom} " + j.nom + ""} size={38} />
              <span style={{ fontSize: 18 }}>{posteIcon[j.poste] || "⚽"}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: T.t1 }}>{j.prenom}</div>
            <div style={{ fontSize: 13, color: T.t3, fontWeight: 500 }}>{j.nom}</div>
            {j.poste && <Badge color={posteColor[j.poste] || T.lime} style={{ marginTop: 8, fontSize: 10 }}>{j.poste}</Badge>}
            {j.numero_licence && <div style={{ fontSize: 10, color: T.t3, marginTop: 4 }}>🪪 {j.numero_licence}</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── CALENDRIER ───────────────────────────────────────────────────────────────
function Calendrier() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editEv, setEditEv] = useState(null);
  const [delModal, setDelModal] = useState(null);
  const ef = { type: "Entraînement", titre: "", date: "", heure_debut: "18:00", heure_fin: "19:30", terrain: "", terrain_lat: null, terrain_lon: null, adversaire: "", format: "11", recurrence: "aucune" };
  const [form, setForm] = useState(ef);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.get("evenements?order=date.asc");
    setEvents(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.date) return;
    const cleanForm = { ...form };
    if (!cleanForm.terrain_lat) delete cleanForm.terrain_lat;
    if (!cleanForm.terrain_lon) delete cleanForm.terrain_lon;
    if (editEv) {
      await db.patch("evenements", editEv.id, cleanForm);
      setEditEv(null);
    } else {
      const gen = (weeks) => {
        const end = new Date("2026-06-30"); let cur = new Date(form.date); const dates = [];
        while (cur <= end) { dates.push(cur.toISOString().split("T")[0]); cur.setDate(cur.getDate() + weeks); }
        return dates;
      };
      if (form.recurrence === "hebdomadaire" || form.recurrence === "saison") {
        for (const d of gen(7)) await db.post("evenements", { ...form, date: d });
      } else if (form.recurrence === "bihebdomadaire") {
        for (const d of gen(14)) await db.post("evenements", { ...form, date: d });
      } else {
        await db.post("evenements", form);
      }
    }
    setShowAdd(false); setForm(ef); load();
  };

  const valider = async id => { await db.patch("evenements", id, { valide: true }); load(); };

  const handleDel = async (opt) => {
    const e = delModal;
    if (opt === "seul") { await db.del("evenements", e.id); }
    else if (opt === "futurs") {
      const all = await db.get("evenements?recurrence=eq.${encodeURIComponent(e.recurrence)}&date=gte." + e.date + "");
      for (const x of (all || [])) await db.del("evenements", x.id);
    } else {
      const all = await db.get("evenements?recurrence=eq." + encodeURIComponent(e.recurrence) + "");
      for (const x of (all || [])) await db.del("evenements", x.id);
    }
    setDelModal(null); load();
  };

  const tColors = { "Entraînement": T.lime, "Match": T.red, "Tournoi": T.amber, "Réunion": T.cyan, "Stage": T.purple };
  const tIcons = { "Entraînement": "🏃", "Match": "⚔️", "Tournoi": "🏆", "Réunion": "📋", "Stage": "🏕️" };

  return (
    <div>
      <Btn full style={{ marginBottom: 16 }} onClick={() => { setForm(ef); setEditEv(null); setShowAdd(true); }}>+ Ajouter un événement</Btn>
      {loading && <Spinner />}
      {!loading && events.length === 0 && <Empty icon="📅" title="Calendrier vide" sub="Créez vos entraînements et matchs" />}
      {events.map(e => (
        <Card key={e.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: "" + tColors[e.type] || T.lime + "15", border: "1px solid " + tColors[e.type] || T.lime + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{tIcons[e.type] || "📅"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.t1 }}>{e.type === "Match" ? "vs ${e.adversaire}" + e.format ? " (Foot "+e.format+")" : "" + "" : e.titre || e.type}</span>
                {e.valide && <Badge color={T.lime} style={{ fontSize: 10 }}>✅ Validé</Badge>}
                {e.recurrence && e.recurrence !== "aucune" && <Badge color={T.cyan} style={{ fontSize: 10 }}>🔄</Badge>}
              </div>
              <div style={{ fontSize: 12, color: T.t3, marginTop: 2 }}>{"📅 " + e.date} · ⏰ {e.heure_debut}{e.heure_fin ? " – " + e.heure_fin + "" : ""}</div>
              {e.terrain && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 12, color: T.t3 }}>📍 {e.terrain}</div>
                  {(e.terrain_lat || e.terrain) && (
                    <button onClick={ev => { ev.stopPropagation(); const q = e.terrain_lat ? e.terrain_lat+","+e.terrain_lon : encodeURIComponent(e.terrain); window.open("https://www.google.com/maps?q="+q,"_blank"); }} style={{ padding: "3px 8px", borderRadius: 8, background: "#4285F422", border: "1px solid #4285F440", color: "#4285F4", fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>🗺️ Y aller</button>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            {!e.valide && <Btn size="sm" variant="success" onClick={() => valider(e.id)} style={{ flex: 1 }}>✅ Valider</Btn>}
            <Btn size="sm" variant="ghost" onClick={() => { setForm({ type: e.type, titre: e.titre || "", date: e.date, heure_debut: e.heure_debut || "18:00", heure_fin: e.heure_fin || "", terrain: e.terrain || "", adversaire: e.adversaire || "", format: e.format || "11", recurrence: e.recurrence || "aucune" }); setEditEv(e); setShowAdd(true); }} style={{ flex: 1 }}>✏️ Modifier</Btn>
            <Btn size="sm" variant="danger" onClick={() => setDelModal(e)} style={{ flex: 1 }}>🗑️</Btn>
          </div>
        </Card>
      ))}

      {delModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.card, borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, border: "1px solid " + T.border }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.t1, marginBottom: 6, textAlign: "center" }}>🗑️ Supprimer</div>
            <div style={{ fontSize: 13, color: T.t3, textAlign: "center", marginBottom: 18 }}>{delModal.type === "Match" ? "vs " + delModal.adversaire + "" : delModal.titre || delModal.type} — {delModal.date}</div>
            {delModal.recurrence && delModal.recurrence !== "aucune" ? (
              <>
                <Btn full variant="ghost" size="sm" onClick={() => handleDel("seul")} style={{ marginBottom: 8 }}>📌 Cet événement uniquement</Btn>
                <Btn full variant="ghost" size="sm" onClick={() => handleDel("futurs")} style={{ marginBottom: 8 }}>⏭️ Cet événement et les suivants</Btn>
                <Btn full variant="danger" size="sm" onClick={() => handleDel("serie")} style={{ marginBottom: 10 }}>❌ Toute la série</Btn>
              </>
            ) : <Btn full variant="danger" size="sm" onClick={() => handleDel("seul")} style={{ marginBottom: 10 }}>🗑️ Confirmer</Btn>}
            <Btn full variant="ghost" size="sm" onClick={() => setDelModal(null)}>Annuler</Btn>
          </div>
        </div>
      )}

      {showAdd && (
        <Drawer title={editEv ? "Modifier l'événement" : "Nouvel événement"} onClose={() => { setShowAdd(false); setEditEv(null); setForm(ef); }}>
          <Field label="Type">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Entraînement", "Match", "Tournoi", "Réunion", "Stage"].map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} style={{ padding: "7px 12px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid " + form.type === t ? tColors[t] : T.border + "", background: form.type === t ? "" + tColors[t] + "18" : "transparent", color: form.type === t ? tColors[t] : T.t3 }}>
                  {tIcons[t]} {t}
                </button>
              ))}
            </div>
          </Field>
          {form.type === "Match" ? (
            <>
              <Input label="Adversaire" value={form.adversaire} onChange={set("adversaire")} placeholder="Nom de l'équipe" />
              <Field label="Format du match">
                <div style={{ display: "flex", gap: 8 }}>
                  {[["11", "⚽ Foot à 11"], ["8", "⚽ Foot à 8"]].map(([id, label]) => (
                    <button key={id} onClick={() => setForm(p => ({ ...p, format: id }))} style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "1.5px solid " + (form.format === id ? T.lime : T.border), background: form.format === id ? T.limeBg : "transparent", color: form.format === id ? T.lime : T.t3 }}>{label}</button>
                  ))}
                </div>
              </Field>
            </>
          ) : <Input label="Titre" value={form.titre} onChange={set("titre")} placeholder="Ex: Séance technique" />}
          <Input label="Date *" type="date" value={form.date} onChange={set("date")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Heure début" type="time" value={form.heure_debut} onChange={set("heure_debut")} />
            <Input label="Heure fin" type="time" value={form.heure_fin} onChange={set("heure_fin")} />
          </div>
          <Field label="Terrain 📍">
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TerrainSearch
                  value={form.terrain}
                  onChange={(val, lat, lon) => setForm(p => ({ ...p, terrain: val, terrain_lat: lat, terrain_lon: lon }))}
                  placeholder="Rechercher le terrain..."
                />
              </div>
              <MicBtn onResult={t => setForm(p => ({ ...p, terrain: t }))} />
            </div>
          </Field>
          {!editEv && (
            <>
              <Sel label="Récurrence" value={form.recurrence} onChange={set("recurrence")}>
                <option value="aucune">Événement unique</option>
                <option value="hebdomadaire">Toutes les semaines</option>
                <option value="bihebdomadaire">Toutes les 2 semaines</option>
                <option value="saison">Toute la saison (jusqu&apos;au 30/06/2026)</option>
              </Sel>
              {form.recurrence !== "aucune" && <div style={{ background: T.cyanBg, border: "1px solid " + T.cyan + "20", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12, color: T.cyan }}>ℹ️ Événements créés jusqu&apos;au 30 juin 2026</div>}
            </>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => { setShowAdd(false); setEditEv(null); setForm(ef); }}>Annuler</Btn>
            <Btn full onClick={save} disabled={!form.date}>✅ {editEv ? "Modifier" : "Créer"}</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ─── CONVOCATIONS ─────────────────────────────────────────────────────────────
function Convocations() {
  const [matchs, setMatchs] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [convocs, setConvocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equipe, setEquipe] = useState("11");

  useEffect(() => {
    const load = async () => {
      const [m, j] = await Promise.all([
        db.get("evenements?type=eq.Match&order=date.asc"),
        db.get("joueurs?actif=eq.true&order=nom.asc")
      ]);
      setMatchs(m || []); setJoueurs(j || []); setLoading(false);
    };
    load();
  }, []);

  const loadConvocs = async id => {
    const data = await db.get("convocations?evenement_id=eq." + id + "");
    setConvocs(data || []);
  };

  const toggle = async jid => {
    const cur = convocs.find(c => c.joueur_id === jid && c.categorie === equipe);
    const other = convocs.find(c => c.joueur_id === jid && c.categorie !== equipe);
    
    if (cur) {
      // Remove instantly from UI
      setConvocs(p => p.filter(c => c.id !== cur.id));
      await db.del("convocations", cur.id);
    } else {
      // Add instantly to UI with temp id
      const tempId = "temp_" + jid;
      const tempConvoc = { id: tempId, evenement_id: selected.id, joueur_id: jid, categorie: equipe, reponse: null };
      if (other) {
        setConvocs(p => [...p.filter(c => c.joueur_id !== jid), tempConvoc]);
        await db.del("convocations", other.id);
      } else {
        setConvocs(p => [...p, tempConvoc]);
      }
      // Save to DB and update with real id
      const r = await db.post("convocations", { evenement_id: selected.id, joueur_id: jid, categorie: equipe });
      if (r?.id) {
        setConvocs(p => p.map(c => c.id === tempId ? r : c));
      }
    }
  };

  const repondre = async (cid, rep) => {
    setConvocs(p => p.map(c => c.id === cid ? { ...c, reponse: rep } : c));
    await db.patch("convocations", cid, { reponse: rep });
  };

  const supprimerToutesConvocs = async () => {
    if (!window.confirm("Supprimer toutes les convocations de ce match ?")) return;
    for (const c of convocs) { await db.del("convocations", c.id); }
    setConvocs([]);
  };

  const repC = { "Présent": T.lime, "Absent": T.red, "Blessé": T.amber, "Malade": T.cyan };
  const repI = { "Présent": "✅", "Absent": "❌", "Blessé": "🚑", "Malade": "🤒" };
  const c11 = convocs.filter(c => c.categorie === "11").length;
  const c8 = convocs.filter(c => c.categorie === "8").length;

  if (selected) return (
    <div>
      <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.t3, cursor: "pointer", fontSize: 14, marginBottom: 16, display: "flex", alignItems: "center", gap: 6, padding: 0 }}>← Retour</button>
      <Card style={{ border: "1px solid " + T.red + "25" }} glow={T.red}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 16, color: T.t1 }}>⚔️ vs {selected.adversaire}</div>
        <div style={{ fontSize: 13, color: T.t3, marginTop: 4 }}>📅 {selected.date} · ⏰ {selected.heure_debut} · 📍 {selected.terrain || "—"}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Badge color={T.lime}>⚽ {c11} en Foot 11</Badge>
          <Badge color={T.cyan}>⚽ {c8} en Foot 8</Badge>
          <Badge color={T.t3}>{joueurs.length - convocs.length} non convoqués</Badge>
        </div>
        {convocs.length > 0 && (
          <button onClick={supprimerToutesConvocs} style={{ marginTop: 12, width: "100%", padding: "8px", borderRadius: 10, background: T.redBg, border: "1px solid " + T.red + "30", color: T.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Supprimer toutes les convocations
          </button>
        )}
      </Card>

      <div style={{ display: "flex", background: T.surface, borderRadius: 12, padding: 4, marginBottom: 14 }}>
        {[["11", "⚽ Foot à 11", T.lime], ["8", "⚽ Foot à 8", T.cyan]].map(([id, label, color]) => (
          <button key={id} onClick={() => setEquipe(id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", transition: "all .15s", background: equipe === id ? color : "transparent", color: equipe === id ? T.bg : T.t3 }}>{label}</button>
        ))}
      </div>

      <SectionLabel>{equipe === "11" ? "Foot à 11" : "Foot à 8"} — {convocs.filter(c => c.categorie === equipe).length} convoqués</SectionLabel>
      {joueurs.map(j => {
        const cc = convocs.find(c => c.joueur_id === j.id && c.categorie === equipe);
        const co = convocs.find(c => c.joueur_id === j.id && c.categorie !== equipe);
        const eColor = equipe === "11" ? T.lime : T.cyan;
        return (
          <Card key={j.id} style={{ border: "1px solid " + cc ? eColor + "40" : T.border + "" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: cc ? 10 : 0 }}>
              <Avatar name={"${j.prenom} " + j.nom + ""} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{j.prenom} {j.nom}</div>
                <div style={{ fontSize: 12, color: T.t3 }}>{j.poste}</div>
                {co && <Badge color={T.amber} style={{ fontSize: 10, marginTop: 4 }}>Dans Foot à {co.categorie === "11" ? "11" : "8"}</Badge>}
              </div>
              <button onClick={() => toggle(j.id)} style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, border: "1.5px solid " + cc ? eColor : T.border + "", background: cc ? "" + eColor + "18" : "transparent", color: cc ? eColor : T.t3, cursor: "pointer" }}>
                {cc ? "✓ Convoqué" : "+ Convoquer"}
              </button>
            </div>
            {cc && (
              <div>
                <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Réponse parent</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(repC).map(([r, color]) => (
                    <button key={r} onClick={() => repondre(cc.id, r)} style={{ flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 11, fontWeight: 700, border: "1.5px solid " + cc.reponse === r ? color : T.border + "", background: cc.reponse === r ? "" + color + "18" : "transparent", color: cc.reponse === r ? color : T.t3, cursor: "pointer", textAlign: "center" }}>
                      {repI[r]}<br /><span style={{ fontSize: 10 }}>{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  return (
    <div>
      <SectionLabel>Matchs à convoquer</SectionLabel>
      {loading && <Spinner />}
      {!loading && matchs.length === 0 && <Empty icon="⚔️" title="Aucun match" sub="Ajoutez des matchs dans le calendrier" />}
      {matchs.map(m => (
        <Card key={m.id} onClick={() => { setSelected(m); loadConvocs(m.id); }} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: T.redBg, border: "1px solid " + T.red + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚔️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: T.t1 }}>vs {m.adversaire}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>📅 {m.date} · ⏰ {m.heure_debut} · 📍 {m.terrain || "—"}</div>
            </div>
            <span style={{ color: T.t3, fontSize: 18 }}>›</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── STATISTIQUES ─────────────────────────────────────────────────────────────
function Statistiques() {
  const [joueurs, setJoueurs] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({ joueur_id: "", buts: 0, passes: 0, temps_jeu: 0 });
  const [tab, setTab] = useState("buts");

  const load = useCallback(async () => {
    setLoading(true);
    const [j, s] = await Promise.all([db.get("joueurs?actif=eq.true&order=nom.asc"), db.get("statistiques?order=created_at.desc")]);
    setJoueurs(j || []); setStats(s || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.joueur_id) return;
    await db.post("statistiques", form);
    setShowAdd(false); setForm({ joueur_id: "", buts: 0, passes: 0, temps_jeu: 0 }); load();
  };

  const byJoueur = joueurs.map(j => {
    const s = stats.filter(x => x.joueur_id === j.id);
    return { ...j, tb: s.reduce((a, x) => a + (x.buts || 0), 0), tp: s.reduce((a, x) => a + (x.passes || 0), 0), tm: s.length };
  });

  const key = tab === "buts" ? "tb" : tab === "passes" ? "tp" : "tm";
  const sorted = [...byJoueur].sort((a, b) => b[key] - a[key]);
  const maxV = Math.max(sorted[0]?.[key] || 1, 1);
  const tabC = { buts: T.lime, passes: T.cyan, matchs: T.amber };

  return (
    <div>
      <Btn full style={{ marginBottom: 14 }} onClick={() => setShowAdd(true)}>+ Ajouter des stats</Btn>
      {confirmDel && <Confirm msg="Supprimer ces stats ?" onOk={async () => { await db.del("statistiques", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}

      <div style={{ display: "flex", background: T.surface, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[["buts", "⚽ Buts"], ["passes", "🎯 Passes"], ["matchs", "📊 Matchs"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "9px 6px", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", transition: "all .15s", background: tab === id ? tabC[id] : "transparent", color: tab === id ? T.bg : T.t3 }}>{label}</button>
        ))}
      </div>

      {loading && <Spinner />}
      <Card>
        {sorted.map((j, i) => {
          const val = j[key]; const color = tabC[tab];
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < sorted.length - 1 ? 14 : 0 }}>
              <div style={{ width: 28, textAlign: "center", fontWeight: 900, fontSize: 16, color: i < 3 ? color : T.t3 }}>{medals[i] || "" + i + 1 + ""}</div>
              <Avatar name={"${j.prenom} " + j.nom + ""} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{j.prenom} {j.nom}</span>
                  <span style={{ fontWeight: 900, color, fontSize: 15 }}>{val}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "" + color + "20" }}>
                  <div style={{ width: "" + (val / maxV) * 100 + "%", height: "100%", background: color, borderRadius: 2, transition: "width .5s" }} />
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {showAdd && (
        <Drawer title="Ajouter des statistiques" onClose={() => setShowAdd(false)}>
          <Sel label="Joueur *" value={form.joueur_id} onChange={e => setForm({ ...form, joueur_id: e.target.value })}>
            <option value="">Choisir un joueur</option>
            {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </Sel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Input label="Buts" type="number" min="0" value={form.buts} onChange={e => setForm({ ...form, buts: parseInt(e.target.value) || 0 })} />
            <Input label="Passes" type="number" min="0" value={form.passes} onChange={e => setForm({ ...form, passes: parseInt(e.target.value) || 0 })} />
            <Input label="Temps (min)" type="number" min="0" value={form.temps_jeu} onChange={e => setForm({ ...form, temps_jeu: parseInt(e.target.value) || 0 })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Btn>
            <Btn full onClick={save} disabled={!form.joueur_id}>✅ Enregistrer</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ─── BLESSURES ────────────────────────────────────────────────────────────────
function Blessures() {
  const [blessures, setBlessures] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editB, setEditB] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const ef = { joueur_id: "", date_blessure: "", type_blessure: "", zone_corps: "", gravite: "Légère", duree_estimee: "", date_reprise_prevue: "", statut: "en cours" };
  const [form, setForm] = useState(ef);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, j] = await Promise.all([db.get("blessures?order=created_at.desc"), db.get("joueurs?actif=eq.true&order=nom.asc")]);
    setBlessures(b || []); setJoueurs(j || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.joueur_id || !form.date_blessure) return;
    // Clean all optional fields
    const clean = {};
    clean.joueur_id = form.joueur_id;
    clean.date_blessure = form.date_blessure;
    clean.statut = form.statut || "en cours";
    clean.gravite = form.gravite || "Légère";
    if (form.type_blessure) clean.type_blessure = form.type_blessure;
    if (form.zone_corps) clean.zone_corps = form.zone_corps;
    if (form.duree_estimee && form.duree_estimee !== "") clean.duree_estimee = parseInt(form.duree_estimee);
    if (form.date_reprise_prevue) clean.date_reprise_prevue = form.date_reprise_prevue;
    if (editB) { await db.patch("blessures", editB.id, clean); setEditB(null); }
    else { await db.post("blessures", clean); }
    setShowAdd(false); setForm(ef); load();
  };

  const getJ = id => joueurs.find(j => j.id === id);
  const gC = { "Légère": T.lime, "Modérée": T.amber, "Grave": T.red };

  return (
    <div>
      <Btn full style={{ marginBottom: 16 }} onClick={() => { setForm(ef); setEditB(null); setShowAdd(true); }}>🚑 Déclarer une blessure</Btn>
      {confirmDel && <Confirm msg="Supprimer cette blessure ?" onOk={async () => { await db.del("blessures", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}
      {loading && <Spinner />}
      {!loading && blessures.length === 0 && <Empty icon="🚑" title="Aucune blessure" sub="Bonne nouvelle !" />}
      {blessures.map(b => {
        const j = getJ(b.joueur_id);
        return (
          <Card key={b.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar name={j ? "${j.prenom} " + j.nom + "" : "?"} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{j ? "${j.prenom} " + j.nom + "" : "Joueur"}</div>
                <div style={{ fontSize: 12, color: T.t3 }}>📅 {b.date_blessure}</div>
              </div>
              <Badge color={gC[b.gravite] || T.t3}>{b.gravite}</Badge>
            </div>
            {b.type_blessure && <div style={{ fontSize: 13, color: T.t2, marginBottom: 4 }}>🩹 {b.type_blessure}{b.zone_corps ? " — " + b.zone_corps + "" : ""}</div>}
            {b.date_reprise_prevue && <div style={{ fontSize: 12, color: T.t3, marginBottom: 8 }}>🔄 Reprise prévue : {b.date_reprise_prevue}</div>}
            <div style={{ marginBottom: 10 }}>
              <Badge color={b.statut === "en cours" ? T.red : T.lime}>{b.statut === "en cours" ? "🔴 En cours" : "✅ Guéri"}</Badge>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" variant="ghost" onClick={() => { setForm({ joueur_id: b.joueur_id, date_blessure: b.date_blessure, type_blessure: b.type_blessure || "", zone_corps: b.zone_corps || "", gravite: b.gravite || "Légère", duree_estimee: b.duree_estimee || "", date_reprise_prevue: b.date_reprise_prevue || "", statut: b.statut }); setEditB(b); setShowAdd(true); }} style={{ flex: 1 }}>✏️ Modifier</Btn>
              {b.statut === "en cours" && <Btn size="sm" variant="success" onClick={() => db.patch("blessures", b.id, { statut: "terminée" }).then(load)} style={{ flex: 1 }}>✅ Guéri</Btn>}
              <Btn size="sm" variant="danger" onClick={() => setConfirmDel(b.id)} style={{ flex: 1 }}>🗑️</Btn>
            </div>
          </Card>
        );
      })}
      {showAdd && (
        <Drawer title={editB ? "Modifier la blessure" : "Déclarer une blessure"} onClose={() => { setShowAdd(false); setEditB(null); setForm(ef); }}>
          <Sel label="Joueur *" value={form.joueur_id} onChange={e => setForm({ ...form, joueur_id: e.target.value })}>
            <option value="">Choisir un joueur</option>
            {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </Sel>
          <Input label="Date *" type="date" value={form.date_blessure} onChange={e => setForm({ ...form, date_blessure: e.target.value })} />
          <Field label="Type de blessure 🎤">
            <div style={{ display: "flex", gap: 8 }}>
              <input autoComplete="off" style={{ flex: 1, background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: T.t1, outline: "none" }} value={form.type_blessure} onChange={e => setForm({ ...form, type_blessure: e.target.value })} placeholder="Entorse, fracture..." />
              <MicBtn onResult={t => setForm(p => ({ ...p, type_blessure: t }))} />
            </div>
          </Field>
          <Input label="Zone du corps" value={form.zone_corps} onChange={e => setForm({ ...form, zone_corps: e.target.value })} placeholder="Cheville, genou..." />
          <Sel label="Gravité" value={form.gravite} onChange={e => setForm({ ...form, gravite: e.target.value })}>
            {["Légère", "Modérée", "Grave"].map(g => <option key={g}>{g}</option>)}
          </Sel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Durée (jours)" type="number" value={form.duree_estimee} onChange={e => setForm({ ...form, duree_estimee: e.target.value })} />
            <Input label="Reprise prévue" type="date" value={form.date_reprise_prevue} onChange={e => setForm({ ...form, date_reprise_prevue: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => { setShowAdd(false); setEditB(null); setForm(ef); }}>Annuler</Btn>
            <Btn full onClick={save} disabled={!form.joueur_id || !form.date_blessure}>✅ {editB ? "Modifier" : "Enregistrer"}</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ─── BILANS ───────────────────────────────────────────────────────────────────
function Bilans() {
  const [bilans, setBilans] = useState([]);
  const [joueurs, setJoueurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editB, setEditB] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [genAI, setGenAI] = useState(false);
  const ef = { joueur_id: "", mois: "", points_forts: "", axes_amelioration: "", comportement: "", assiduite: "", note_technique: "🟢", note_tactique: "🟢", note_comportement: "🟢", note_respect: "🟢", note_assiduite: "🟢", note_engagement: "🟢" };
  const [form, setForm] = useState(ef);

  const load = useCallback(async () => {
    setLoading(true);
    const [b, j] = await Promise.all([db.get("bilans?order=created_at.desc"), db.get("joueurs?actif=eq.true&order=nom.asc")]);
    setBilans(b || []); setJoueurs(j || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const genIA = async () => {
    if (!form.joueur_id) return;
    const j = joueurs.find(x => x.id === form.joueur_id);
    setGenAI(true);
    try {
      const prompt = "Tu es un educateur de football bienveillant. Genere un bilan mensuel pour " + (j?.prenom||"") + " " + (j?.nom||"") + ", joueur U13, poste: " + (j?.poste||"") + ". Reponds UNIQUEMENT avec un objet JSON valide avec exactement ces 4 champs: points_forts, axes_amelioration, comportement, assiduite. 2-3 phrases encourageantes par champ pour un enfant de 12-13 ans.";
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const d = await r.json();
      const txt = (d.content || []).map(x => x.text || "").join("").trim() || "{}";
      const clean = txt.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      setForm(p => ({ ...p, ...parsed }));
    } catch (e) {
      console.error("AI error:", e);
      alert("Erreur IA - reessayez");
    }
    setGenAI(false);
  };

  const save = async () => {
    if (!form.joueur_id || !form.mois) return;
    if (editB) { await db.patch("bilans", editB.id, form); setEditB(null); }
    else { await db.post("bilans", form); }
    setShowAdd(false); setForm(ef); load();
  };

  const notes = ["🟢", "🟡", "🟠", "🔴"];
  const getJ = id => joueurs.find(j => j.id === id);

  return (
    <div>
      <Btn full style={{ marginBottom: 16 }} onClick={() => { setForm(ef); setEditB(null); setShowAdd(true); }}>📊 Créer un bilan</Btn>
      {confirmDel && <Confirm msg="Supprimer ce bilan ?" onOk={async () => { await db.del("bilans", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}
      {loading && <Spinner />}
      {!loading && bilans.length === 0 && <Empty icon="📊" title="Aucun bilan" sub="Créez le premier bilan de la saison" />}
      {bilans.map(b => {
        const j = getJ(b.joueur_id);
        return (
          <Card key={b.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Avatar name={j ? "${j.prenom} " + j.nom + "" : "?"} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: T.t1 }}>{j ? "${j.prenom} " + j.nom + "" : "Joueur"}</div>
                <div style={{ fontSize: 12, color: T.t3 }}>📅 {b.mois}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              {[["Tech", b.note_technique], ["Tact", b.note_tactique], ["Comp", b.note_comportement], ["Resp", b.note_respect], ["Assi", b.note_assiduite], ["Enga", b.note_engagement]].map(([k, v]) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18 }}>{v}</div>
                  <div style={{ fontSize: 9, color: T.t3, fontWeight: 700, letterSpacing: 0.5 }}>{k}</div>
                </div>
              ))}
            </div>
            {b.points_forts && <div style={{ fontSize: 13, color: T.t2, marginBottom: 6, padding: "8px 10px", background: T.limeBg, borderRadius: 8 }}><strong style={{ color: T.lime }}>✅ </strong>{b.points_forts}</div>}
            {b.axes_amelioration && <div style={{ fontSize: 13, color: T.t2, marginBottom: 10, padding: "8px 10px", background: T.amberBg, borderRadius: 8 }}><strong style={{ color: T.amber }}>📈 </strong>{b.axes_amelioration}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn size="sm" variant="ghost" onClick={() => { setForm({ joueur_id: b.joueur_id, mois: b.mois, points_forts: b.points_forts || "", axes_amelioration: b.axes_amelioration || "", comportement: b.comportement || "", assiduite: b.assiduite || "", note_technique: b.note_technique || "🟢", note_tactique: b.note_tactique || "🟢", note_comportement: b.note_comportement || "🟢", note_respect: b.note_respect || "🟢", note_assiduite: b.note_assiduite || "🟢", note_engagement: b.note_engagement || "🟢" }); setEditB(b); setShowAdd(true); }} style={{ flex: 1 }}>✏️</Btn>
              <Btn size="sm" variant="danger" onClick={() => setConfirmDel(b.id)} style={{ flex: 1 }}>🗑️</Btn>
            </div>
          </Card>
        );
      })}
      {showAdd && (
        <Drawer title={editB ? "Modifier le bilan" : "Nouveau bilan"} onClose={() => { setShowAdd(false); setEditB(null); setForm(ef); }}>
          <Sel label="Joueur *" value={form.joueur_id} onChange={e => setForm({ ...form, joueur_id: e.target.value })}>
            <option value="">Choisir un joueur</option>
            {joueurs.map(j => <option key={j.id} value={j.id}>{j.prenom} {j.nom}</option>)}
          </Sel>
          <Input label="Mois *" placeholder="Ex: Janvier 2026" value={form.mois} onChange={e => setForm({ ...form, mois: e.target.value })} />
          <Btn full variant="ghost" onClick={genIA} disabled={!form.joueur_id || genAI} style={{ marginBottom: 14 }}>
            {genAI ? "⏳ Génération IA..." : "🤖 Générer avec l'IA"}
          </Btn>
          <Field label="Notes par critère">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Technique", "note_technique"], ["Tactique", "note_tactique"], ["Comportement", "note_comportement"], ["Respect", "note_respect"], ["Assiduité", "note_assiduite"], ["Engagement", "note_engagement"]].map(([label, key]) => (
                <div key={key}>
                  <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, fontWeight: 700 }}>{label}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {notes.map(n => <button key={n} onClick={() => setForm({ ...form, [key]: n })} style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 15, border: "1.5px solid " + form[key] === n ? T.lime : T.border + "", background: form[key] === n ? T.limeBg : "transparent", cursor: "pointer" }}>{n}</button>)}
                  </div>
                </div>
              ))}
            </div>
          </Field>
          <TA label="✅ Points forts" voice onVoice={t => setForm(p => ({ ...p, points_forts: p.points_forts + " " + t }))} value={form.points_forts} onChange={e => setForm({ ...form, points_forts: e.target.value })} placeholder="Points positifs..." />
          <TA label="📈 Axes d'amélioration" voice onVoice={t => setForm(p => ({ ...p, axes_amelioration: p.axes_amelioration + " " + t }))} value={form.axes_amelioration} onChange={e => setForm({ ...form, axes_amelioration: e.target.value })} placeholder="Ce qu'il peut améliorer..." />
          <TA label="😊 Comportement" voice onVoice={t => setForm(p => ({ ...p, comportement: p.comportement + " " + t }))} value={form.comportement} onChange={e => setForm({ ...form, comportement: e.target.value })} placeholder="Comportement dans le groupe..." />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => { setShowAdd(false); setEditB(null); setForm(ef); }}>Annuler</Btn>
            <Btn full onClick={save} disabled={!form.joueur_id || !form.mois}>✅ {editB ? "Modifier" : "Enregistrer"}</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────
function Messages({ user }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [dest, setDest] = useState("Tous");

  const load = useCallback(async () => {
    const data = await db.get("messages?order=created_at.desc");
    setMsgs(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    await db.post("messages", { de: user.nom, a: dest, texte: text, lu: false });
    setText(""); load();
  };

  const dests = [
    { id: "Tous", label: "👥 Tous", color: T.lime },
    { id: "Foot 11", label: "⚽ Foot 11", color: T.cyan },
    { id: "Foot 8", label: "⚽ Foot 8", color: T.amber },
    { id: "Repos", label: "😴 Repos", color: T.t3 },
  ];

  return (
    <div>
      {confirmDel && <Confirm msg="Supprimer ce message ?" onOk={async () => { await db.del("messages", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}

      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Envoyer à</SectionLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {dests.map(d => (
            <button key={d.id} onClick={() => setDest(d.id)} style={{ padding: "7px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid " + dest === d.id ? d.color : T.border + "", background: dest === d.id ? "" + d.color + "15" : "transparent", color: dest === d.id ? d.color : T.t3 }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <Spinner />}
      {!loading && msgs.length === 0 && <Empty icon="💬" title="Aucun message" />}
      {msgs.map(m => {
        const isMe = m.de === user.nom;
        const dc = dests.find(d => d.id === m.a)?.color || T.t3;
        return (
          <Card key={m.id} style={{ background: isMe ? T.limeBg : T.card, border: "1px solid " + isMe ? T.lime + "30" : T.border + "" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? T.lime : T.t3 }}>{m.de}</span>
                <span style={{ fontSize: 10, color: T.t3 }}>→</span>
                <Badge color={dc} style={{ fontSize: 10 }}>{m.a}</Badge>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: T.t3 }}>{new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                <button onClick={() => setConfirmDel(m.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.t3, fontSize: 14, padding: 0 }}>🗑️</button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: T.t2 }}>{m.texte}</p>
          </Card>
        );
      })}

      <div style={{ position: "fixed", bottom: 64, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "10px 16px", background: T.card, borderTop: "1px solid " + T.border, boxSizing: "border-box", zIndex: 150 }}>
        <div style={{ fontSize: 11, color: T.t3, marginBottom: 6, fontWeight: 600 }}>→ {dests.find(d => d.id === dest)?.label}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <MicBtn onResult={t => setText(p => p + " " + t)} />
          <input style={{ flex: 1, background: T.surface, border: "1px solid " + T.border, borderRadius: 10, padding: "11px 14px", fontSize: 15, color: T.t1, outline: "none" }} placeholder="Message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} autoComplete="off" />
          <button onClick={send} style={{ width: 44, height: 44, borderRadius: 10, background: text.trim() ? T.lime : T.border, border: "none", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: text.trim() ? T.bg : T.t3 }}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── RÉSULTATS ────────────────────────────────────────────────────────────────
function Resultats() {
  const [matchs, setMatchs] = useState([]);
  const [resultats, setResultats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editR, setEditR] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({ score_nous: "", score_adversaire: "", resume: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [m, r] = await Promise.all([db.get("evenements?type=eq.Match&order=date.desc"), db.get("resultats?order=created_at.desc")]);
    setMatchs(m || []); setResultats(r || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!selected || form.score_nous === "" || form.score_adversaire === "") return;
    const data = { evenement_id: selected.id, score_nous: parseInt(form.score_nous), score_adversaire: parseInt(form.score_adversaire), resume: form.resume };
    if (editR) { await db.patch("resultats", editR.id, data); setEditR(null); }
    else { await db.post("resultats", data); }
    setSelected(null); setForm({ score_nous: "", score_adversaire: "", resume: "" }); load();
  };

  const getR = id => resultats.find(r => r.evenement_id === id);

  return (
    <div>
      {confirmDel && <Confirm msg="Supprimer ce résultat ?" onOk={async () => { await db.del("resultats", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}
      <SectionLabel>Résultats des matchs</SectionLabel>
      {loading && <Spinner />}
      {!loading && matchs.length === 0 && <Empty icon="⚔️" title="Aucun match" sub="Ajoutez des matchs dans le calendrier" />}
      {matchs.map(m => {
        const r = getR(m.id);
        const v = r && r.score_nous > r.score_adversaire;
        const d = r && r.score_nous < r.score_adversaire;
        return (
          <Card key={m.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: T.redBg, border: "1px solid " + T.red + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⚔️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.t1 }}>vs {m.adversaire}</div>
                <div style={{ fontSize: 12, color: T.t3 }}>📅 {m.date} · 📍 {m.terrain || "—"}</div>
              </div>
              {r ? (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, color: v ? T.lime : d ? T.red : T.amber }}>{r.score_nous} — {r.score_adversaire}</div>
                  <Badge color={v ? T.lime : d ? T.red : T.amber} style={{ fontSize: 10 }}>{v ? "Victoire" : d ? "Défaite" : "Nul"}</Badge>
                </div>
              ) : <Badge color={T.t3}>À saisir</Badge>}
            </div>
            {r?.resume && <p style={{ margin: "10px 0 0", fontSize: 13, color: T.t3, lineHeight: 1.5 }}>{r.resume}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Btn size="sm" variant="ghost" onClick={() => { setSelected(m); setEditR(r || null); setForm(r ? { score_nous: r.score_nous, score_adversaire: r.score_adversaire, resume: r.resume || "" } : { score_nous: "", score_adversaire: "", resume: "" }); }} style={{ flex: 1 }}>{r ? "✏️ Modifier" : "➕ Saisir"}</Btn>
              {r && <Btn size="sm" variant="danger" onClick={() => setConfirmDel(r.id)} style={{ flex: 1 }}>🗑️</Btn>}
            </div>
          </Card>
        );
      })}
      {selected && (
        <Drawer title={"Résultat vs " + selected.adversaire + ""} onClose={() => { setSelected(null); setEditR(null); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, marginBottom: 8, letterSpacing: 1 }}>NOUS</div>
              <input type="number" min="0" value={form.score_nous} onChange={e => setForm({ ...form, score_nous: e.target.value })} style={{ width: "100%", background: T.surface, border: "1px solid " + T.border, borderRadius: 12, padding: "14px 8px", fontSize: 38, fontWeight: 900, color: T.lime, outline: "none", textAlign: "center", colorScheme: "dark", fontFamily: "'Space Grotesk',sans-serif" }} placeholder="0" />
            </div>
            <div style={{ fontSize: 26, color: T.t3, fontWeight: 900, textAlign: "center" }}>—</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.t3, marginBottom: 8, letterSpacing: 1 }}>EUX</div>
              <input type="number" min="0" value={form.score_adversaire} onChange={e => setForm({ ...form, score_adversaire: e.target.value })} style={{ width: "100%", background: T.surface, border: "1px solid " + T.border, borderRadius: 12, padding: "14px 8px", fontSize: 38, fontWeight: 900, color: T.red, outline: "none", textAlign: "center", colorScheme: "dark", fontFamily: "'Space Grotesk',sans-serif" }} placeholder="0" />
            </div>
          </div>
          <TA label="Résumé du match 🎤" voice onVoice={t => setForm(p => ({ ...p, resume: p.resume + " " + t }))} value={form.resume} onChange={e => setForm({ ...form, resume: e.target.value })} placeholder="Résumé, buteurs, points clés..." />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => { setSelected(null); setEditR(null); }}>Annuler</Btn>
            <Btn full onClick={save} disabled={form.score_nous === "" || form.score_adversaire === ""}>✅ {editR ? "Modifier" : "Enregistrer"}</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}

// ─── MATÉRIEL ────────────────────────────────────────────────────────────────
function Materiel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const ef = { nom: "", quantite: 1, etat: "Bon", responsable: "", date_remise: "", date_retour: "" };
  const [form, setForm] = useState(ef);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.get("materiel?order=created_at.desc");
    setItems(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom) return;
    const clean = { ...form };
    if (!clean.date_remise) delete clean.date_remise;
    if (!clean.date_retour) delete clean.date_retour;
    clean.quantite = parseInt(clean.quantite) || 1;
    if (editItem) { await db.patch("materiel", editItem.id, clean); setEditItem(null); }
    else { await db.post("materiel", clean); }
    setShowAdd(false); setForm(ef); load();
  };

  const eC = { "Bon": T.lime, "Usé": T.amber, "À remplacer": T.red };
  const mI = { "Ballons": "⚽", "Chasubles": "🦺", "Pharmacie": "🩹", "Maillots": "👕", "Coupelles": "🔶", "Sac matériel": "🎒", "Autre": "📦" };

  return (
    <div>
      <Btn full style={{ marginBottom: 16 }} onClick={() => { setForm(ef); setEditItem(null); setShowAdd(true); }}>+ Ajouter du matériel</Btn>
      {confirmDel && <Confirm msg="Supprimer cet article ?" onOk={async () => { await db.del("materiel", confirmDel); setConfirmDel(null); load(); }} onCancel={() => setConfirmDel(null)} />}
      {loading && <Spinner />}
      {!loading && items.length === 0 && <Empty icon="📦" title="Aucun matériel" sub="Inventoriez votre matériel" />}
      {items.map(item => (
        <Card key={item.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: T.limeBg, border: "1px solid " + T.lime + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{mI[item.nom] || "📦"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.t1 }}>{item.nom}</div>
              <div style={{ fontSize: 12, color: T.t3 }}>Qté : {item.quantite}{item.responsable ? " · 👤 " + item.responsable + "" : ""}</div>
              {item.date_retour && <div style={{ fontSize: 12, color: T.amber }}>🔄 Retour : {item.date_retour}</div>}
            </div>
            <Badge color={eC[item.etat] || T.t3}>{item.etat}</Badge>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Btn size="sm" variant="ghost" onClick={() => { setForm({ nom: item.nom, quantite: item.quantite, etat: item.etat, responsable: item.responsable || "", date_remise: item.date_remise || "", date_retour: item.date_retour || "" }); setEditItem(item); setShowAdd(true); }} style={{ flex: 1 }}>✏️ Modifier</Btn>
            <Btn size="sm" variant="danger" onClick={() => setConfirmDel(item.id)} style={{ flex: 1 }}>🗑️ Supprimer</Btn>
          </div>
        </Card>
      ))}
      {showAdd && (
        <Drawer title={editItem ? "Modifier le matériel" : "Ajouter du matériel"} onClose={() => { setShowAdd(false); setEditItem(null); setForm(ef); }}>
          <Sel label="Type *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}>
            <option value="">Choisir...</option>
            {Object.keys(mI).map(m => <option key={m}>{m}</option>)}
          </Sel>
          <Input label="Quantité" type="number" min="1" value={form.quantite} onChange={e => setForm({ ...form, quantite: parseInt(e.target.value) || 1 })} />
          <Sel label="État" value={form.etat} onChange={e => setForm({ ...form, etat: e.target.value })}>
            {["Bon", "Usé", "À remplacer"].map(e => <option key={e}>{e}</option>)}
          </Sel>
          <Input label="Responsable" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Qui le garde ?" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Date remise" type="date" value={form.date_remise} onChange={e => setForm({ ...form, date_remise: e.target.value })} />
            <Input label="Date retour" type="date" value={form.date_retour} onChange={e => setForm({ ...form, date_retour: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => { setShowAdd(false); setEditItem(null); setForm(ef); }}>Annuler</Btn>
            <Btn full onClick={save} disabled={!form.nom}>✅ {editItem ? "Modifier" : "Enregistrer"}</Btn>
          </div>
        </Drawer>
      )}
    </div>
  );
}



// ─── TERRAIN AUTOCOMPLETE ─────────────────────────────────────────────────────
function TerrainSearch({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const search = async (q) => {
    if (q.length < 3) { setSuggestions([]); return; }
    try {
      const r = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(q) + "&limit=5&countrycodes=fr",
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await r.json();
      setSuggestions(data.map(d => ({
        short: d.display_name.split(",").slice(0, 3).join(","),
        lat: d.lat,
        lon: d.lon
      })));
      setShow(true);
    } catch(e) { setSuggestions([]); }
  };

  const handleChange = (e) => {
    onChange(e.target.value, null, null);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(e.target.value), 500);
  };

  const select = (s) => {
    onChange(s.short, s.lat, s.lon);
    setSuggestions([]);
    setShow(false);
  };

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        autoComplete="off" autoCorrect="off"
        style={{ width: "100%", background: "#F8FAFC", border: "1px solid " + T.border, borderRadius: 10, padding: "12px 14px", fontSize: 15, color: T.t1, outline: "none" }}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Rechercher un terrain..."}
        onFocus={() => suggestions.length > 0 && setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
      />
      {show && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: "1px solid " + T.border, borderRadius: 10, zIndex: 1000, overflow: "hidden", marginTop: 4 }}>
          {suggestions.map((s, i) => (
            <div key={i} onMouseDown={() => select(s)} style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, color: T.t1, borderBottom: i < suggestions.length - 1 ? "1px solid " + T.border : "none" }}>
              {"📍 " + s.short}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// COMPOSITIONS
function Compositions() {
  const [joueurs, setJoueurs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [formation, setFormation] = useState("4-3-3");
  const [mode, setMode] = useState("11");
  const [loading, setLoading] = useState(true);
  const [capitaine, setCapitaine] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.get("joueurs?actif=eq.true&order=nom.asc");
    setJoueurs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const f11 = {
    "4-3-3": [{pos:"GB",x:50,y:90},{pos:"DD",x:15,y:72},{pos:"DC",x:35,y:72},{pos:"DC",x:65,y:72},{pos:"DG",x:85,y:72},{pos:"MD",x:20,y:48},{pos:"MC",x:50,y:45},{pos:"MG",x:80,y:48},{pos:"AD",x:15,y:22},{pos:"AC",x:50,y:16},{pos:"AG",x:85,y:22}],
    "4-4-2": [{pos:"GB",x:50,y:90},{pos:"DD",x:15,y:72},{pos:"DC",x:35,y:72},{pos:"DC",x:65,y:72},{pos:"DG",x:85,y:72},{pos:"MD",x:15,y:50},{pos:"MC",x:38,y:50},{pos:"MC",x:62,y:50},{pos:"MG",x:85,y:50},{pos:"AT",x:33,y:22},{pos:"AT",x:67,y:22}],
    "3-5-2": [{pos:"GB",x:50,y:90},{pos:"DC",x:25,y:72},{pos:"DC",x:50,y:72},{pos:"DC",x:75,y:72},{pos:"MD",x:10,y:50},{pos:"MC",x:30,y:48},{pos:"MC",x:50,y:45},{pos:"MC",x:70,y:48},{pos:"MG",x:90,y:50},{pos:"AT",x:33,y:22},{pos:"AT",x:67,y:22}],
  };
  const f8 = [{pos:"GB",x:50,y:90},{pos:"DD",x:20,y:70},{pos:"DC",x:50,y:70},{pos:"DG",x:80,y:70},{pos:"MD",x:20,y:46},{pos:"MC",x:50,y:44},{pos:"MG",x:80,y:46},{pos:"AT",x:50,y:18}];

  const posData = mode === "11" ? (f11[formation] || f11["4-3-3"]) : f8;
  const maxP = mode === "11" ? 11 : 8;
  const toggle = (j) => setSelected(prev => { const isIn = prev.find(x => x.id === j.id); if (isIn) return prev.filter(x => x.id !== j.id); if (prev.length >= maxP) return prev; return [...prev, j]; });
  const isSel = (j) => !!selected.find(x => x.id === j.id);

  return (
    <div>
      <div style={{ display: "flex", background: T.surface, borderRadius: 12, padding: 4, marginBottom: 14, border: "1px solid " + T.border }}>
        {[["11", "Foot 11"], ["8", "Foot 8"]].map(function(item) {
          var id = item[0]; var label = item[1];
          return (
            <button key={id} onClick={function() { setMode(id); setSelected([]); }} style={{ flex: 1, padding: "10px 8px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: mode === id ? T.lime : "transparent", color: mode === id ? T.bg : T.t3 }}>{label}</button>
          );
        })}
      </div>
      {mode === "11" && (
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
          {Object.keys(f11).map(function(f) {
            return (
              <button key={f} onClick={function() { setFormation(f); }} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, border: "1px solid " + (formation === f ? T.lime : T.border), background: formation === f ? T.limeBg : "transparent", color: formation === f ? T.lime : T.t3 }}>{f}</button>
            );
          })}
        </div>
      )}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.t3 }}>{mode === "11" ? formation : "Foot a 8"}</span>
          <span style={{ fontSize: 12, color: T.lime, fontWeight: 700 }}>{selected.length}/{maxP}</span>
        </div>
        <svg viewBox="0 0 300 420" style={{ width: "100%", borderRadius: 10 }}>
          <rect width="300" height="420" fill="#1A5C32" rx="10" />
          <rect x="15" y="15" width="270" height="390" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" rx="6" />
          <line x1="15" y1="210" x2="285" y2="210" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="150" cy="210" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="95" y="15" width="110" height="55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <rect x="95" y="350" width="110" height="55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {posData.map(function(p, i) {
            var j = selected[i];
            var cx = (p.x / 100) * 270 + 15;
            var cy = (p.y / 100) * 390 + 15;
            var isCapt = j && capitaine === j.id;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r="18" fill={j ? getAvatarColor(j.prenom) : "rgba(255,255,255,0.1)"} stroke={isCapt ? "#FFB020" : "none"} strokeWidth="2.5" />
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="800" fill="#0E1820">{j ? j.prenom[0] + j.nom[0] : "+"}</text>
                <text x={cx} y={cy + 28} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.6)" fontWeight="600">{p.pos}</text>
              </g>
            );
          })}
        </svg>
      </Card>
      <SL>Joueurs ({selected.length}/{maxP})</SL>
      {loading && <Spinner />}
      {joueurs.map(function(j) {
        var sel = isSel(j);
        return (
          <div key={j.id} onClick={function() { toggle(j); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: sel ? T.limeBg : T.card, border: "1px solid " + (sel ? T.lime + "50" : T.border), cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <Avatar name={j.prenom + " " + j.nom} size={34} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.t1 }}>{j.prenom} {j.nom}</div>
              <div style={{ fontSize: 11, color: T.t3 }}>{j.poste}</div>
            </div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: sel ? T.lime : T.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: sel ? T.bg : T.t3, fontWeight: 900 }}>{sel ? "+" : "+"}</div>
          </div>
        );
      })}
    </div>
  );
}


// TERRAINS
function Terrains() {
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const ef = { nom: "", adresse: "", surface: "Herbe naturelle", latitude: "", longitude: "" };
  const [form, setForm] = useState(ef);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await db.get("terrains?order=created_at.desc");
    setTerrains(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.nom) return;
    const clean = { nom: form.nom, adresse: form.adresse, surface: form.surface };
    if (form.latitude) clean.latitude = parseFloat(form.latitude);
    if (form.longitude) clean.longitude = parseFloat(form.longitude);
    await db.post("terrains", clean);
    setShowAdd(false);
    setForm(ef);
    load();
  };

  const nav = (t, app) => {
    const q = t.latitude && t.longitude ? t.latitude + "," + t.longitude : encodeURIComponent(t.adresse || t.nom);
    const urls = {
      google: "https://www.google.com/maps?q=" + q,
      waze: "https://waze.com/ul?ll=" + q + "&navigate=yes",
      apple: "https://maps.apple.com/?q=" + q
    };
    window.open(urls[app], "_blank");
  };

  const sC = { "Herbe naturelle": T.lime, "Synthetique": T.cyan, "Salle": T.amber };
  const sI = { "Herbe naturelle": "Herbe", "Synthetique": "Synth.", "Salle": "Salle" };

  return (
    <div>
      <Btn full style={{ marginBottom: 16 }} onClick={() => { setForm(ef); setShowAdd(true); }}>
        + Ajouter un terrain
      </Btn>
      {confirmDel && (
        <Confirm
          msg="Supprimer ce terrain ?"
          onOk={async () => { await db.del("terrains", confirmDel); setConfirmDel(null); load(); }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
      {loading && <Spinner />}
      {!loading && terrains.length === 0 && (
        <Empty icon="📍" title="Aucun terrain" sub="Ajoutez vos terrains" />
      )}
      {terrains.map(t => (
        <Card key={t.id}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: (sC[t.surface] || T.lime) + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {"📍"}
            </div>
    
