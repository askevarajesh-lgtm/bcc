import React, { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./grapesjs-theme.css"; // Premium custom theme override
import webpagePlugin from "grapesjs-preset-webpage";
import { Button, message, Modal, Select, Input } from "antd";
const { Option } = Select;
import { ArrowLeft } from "lucide-react";
import CustomImagePanel from "./CustomImagePanel";
import MediaStorageModal from "./MediaStorageModal";

const getWidgetHtmlOnly = (widget) => {
  if (!widget) return "";
  const positionCss =
    widget.launcherPosition === "Bottom left"
      ? "left: 24px !important; right: auto !important;"
      : "right: 24px !important; left: auto !important;";

  const bottomOffset =
    widget.launcherPosition === "Bottom left" ? "30px" : "90px";

  const channelsHtml = (widget.channels || [])
    .map((ch) => {
      let icon = "";
      let link = "#";
      let label = ch;
      let clickHandler = "";

      if (ch === "WhatsApp") {
        icon = `<svg style="width:20px !important;height:20px !important;fill:currentColor !important;" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.019-5.117-2.875-6.974C16.592 1.91 14.121.889 11.5.888c-5.441 0-9.865 4.424-9.869 9.869-.001 1.755.464 3.468 1.346 4.985L1.929 20.91l5.447-1.43c1.554.847 3.11 1.274 4.83 1.274zm9.467-6.807c-.242-.12-.1.43-.88-.413l-.95-.475c-.2-.1-.4-.1-.5.1l-.4.5c-.1.1-.2.1-.4 0-1.05-.5-1.75-1.2-2.1-1.8-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2 0-.3l-.9-2.15c-.1-.2-.2-.2-.4-.2h-.3c-.2 0-.5.1-.7.3-.6.6-.9 1.4-.9 2.2 0 1.6 1.05 3.1 1.2 3.3.15.2 2.1 3.2 5.1 4.5.7.3 1.25.5 1.7.6.7.2 1.35.15 1.85.1.55-.05 1.7-.7 1.95-1.35.25-.65.25-1.2.15-1.35-.1-.2-.3-.3-.75-.45z"/></svg>`;
        link = `https://wa.me/${(widget.whatsappPhone || "").replace(/[^0-9]/g, "")}`;
      } else if (ch === "Email") {
        icon = `<svg style="width:20px !important;height:20px !important;fill:none !important;stroke:currentColor !important;stroke-width:2 !important;" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>`;
        link = `mailto:${widget.supportEmail || ""}`;
      } else if (ch === "SMS") {
        icon = `<svg style="width:20px !important;height:20px !important;fill:none !important;stroke:currentColor !important;stroke-width:2 !important;" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
        link = `sms:${widget.whatsappPhone || ""}`;
      } else if (ch === "Live chat") {
        icon = `<svg style="width:20px !important;height:20px !important;fill:none !important;stroke:currentColor !important;stroke-width:2 !important;" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`;
        clickHandler = `onclick="openLiveChatPopup()"`;
      } else {
        icon = `<svg style="width:20px !important;height:20px !important;fill:none !important;stroke:currentColor !important;stroke-width:2 !important;" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
      }

      return `
      <a href="${link}" ${clickHandler} target="_blank" style="display:flex !important;align-items:center !important;gap:14px !important;padding:14px 18px !important;background:#ffffff !important;border:1px solid #e2e8f0 !important;border-radius:12px !important;color:#1e293b !important;text-decoration:none !important;font-weight:600 !important;font-size:14px !important;transition:all 0.2s !important;font-family:'Inter',sans-serif !important;box-sizing:border-box !important;text-transform:none !important;letter-spacing:normal !important;line-height:1.2 !important;width:100% !important;text-align:left !important;box-shadow:0 1px 3px rgba(0,0,0,0.02) !important;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';" onmouseout="this.style.background='#ffffff'; this.style.borderColor='#e2e8f0';">
        <span style="color:${widget.brandColor || "#3b82f6"} !important; display:flex !important; align-items:center !important; justify-content:center !important; flex-shrink:0 !important;">${icon}</span>
        <span style="color:#1e293b !important; font-family:'Inter',sans-serif !important; font-size:14px !important; font-weight:600 !important;">${label}</span>
      </a>
    `;
    })
    .join("");

  return `
    <div id="bcc-chat-widget" style="font-family:'Inter', sans-serif !important; position:fixed !important; bottom:${bottomOffset} !important; ${positionCss} z-index:999999 !important; display:block !important; margin:0 !important; padding:0 !important; box-sizing:border-box !important; border:none !important; background:none !important;">
      <!-- Launcher (DIV-based to prevent template button overrides) -->
      <div onclick="toggleBccChat()" style="background:${widget.brandColor || "#3b82f6"} !important; color:#ffffff !important; border:none !important; border-radius:50px !important; padding:14px 24px !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:10px !important; cursor:pointer !important; box-shadow:0 10px 25px -5px rgba(0,0,0,0.2) !important; font-weight:700 !important; font-size:15px !important; transition:all 0.3s !important; z-index:999999 !important; outline:none !important; width:auto !important; height:auto !important; min-width:unset !important; min-height:unset !important; max-width:none !important; max-height:none !important; line-height:1.2 !important; text-transform:none !important; letter-spacing:normal !important; font-family:'Inter', sans-serif !important; margin:0 !important; box-sizing:border-box !important;" onmouseover="this.style.transform='scale(1.05) translateY(-2px)'" onmouseout="this.style.transform='scale(1) translateY(0)'">
        <svg style="width:24px !important;height:24px !important;fill:currentColor !important;display:inline-block !important;vertical-align:middle !important;margin:0 !important;padding:0 !important;flex-shrink:0 !important;" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.13 2 11.23c0 2.946 1.487 5.576 3.82 7.377a.75.75 0 01.246.685l-.758 3.51a.75.75 0 001.077.787l4.032-2.128a.75.75 0 01.62-.057c.928.326 1.93.504 2.963.504 5.523 0 10-4.13 10-9.23C22 6.13 17.523 2 12 2zm0 15c-.886 0-1.745-.148-2.544-.43a2.25 2.25 0 00-1.859.17l-2.48 1.309.467-2.164a2.25 2.25 0 00-.737-2.057C3.376 12.63 2.5 10.984 2.5 9.23 2.5 5.503 6.74 2.5 12 2.5s9.5 3.003 9.5 6.73c0 3.727-4.24 6.77-9.5 6.77z"/>
        </svg>
        <span style="font-family:'Inter', sans-serif !important; font-size:15px !important; font-weight:700 !important; color:#ffffff !important; text-transform:none !important; letter-spacing:normal !important; line-height:1.2 !important; display:inline-block !important; margin:0 !important; padding:0 !important;">${widget.launcherLabel || "Chat"}</span>
      </div>

      <!-- Chat Window -->
      <div id="bcc-chat-window" style="display:none !important; position:absolute !important; bottom:70px !important; ${widget.launcherPosition === "Bottom left" ? "left: 0 !important;" : "right: 0 !important;"} width:360px !important; background:#ffffff !important; border-radius:20px !important; box-shadow:0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04) !important; border:1px solid #e2e8f0 !important; overflow:hidden !important; transition:all 0.3s ease !important; transform:translateY(10px) !important; opacity:0 !important; z-index:9999999 !important; font-family:'Inter', sans-serif !important; box-sizing:border-box !important;">
        <!-- Header -->
        <div style="background:${widget.brandColor || "#3b82f6"} !important; color:#ffffff !important; padding:24px 20px 20px 20px !important; position:relative !important; box-sizing:border-box !important; border-top-left-radius:20px !important; border-top-right-radius:20px !important; display:block !important; text-align:left !important;">
          <div style="display:flex !important; align-items:center !important; gap:12px !important; margin-bottom:8px !important;">
            <!-- Avatar with online indicator -->
            <div style="position:relative !important; width:40px !important; height:40px !important; background:rgba(255,255,255,0.2) !important; border-radius:50% !important; display:flex !important; align-items:center !important; justify-content:center !important; font-weight:700 !important; color:#ffffff !important; font-size:18px !important; border: 2px solid rgba(255,255,255,0.4) !important; font-family:'Inter',sans-serif !important; box-sizing:border-box !important;">
              ${widget.name.charAt(0).toUpperCase()}
              <span style="position:absolute !important; bottom:0 !important; right:0 !important; width:10px !important; height:10px !important; background:#22c55e !important; border:2px solid ${widget.brandColor || "#3b82f6"} !important; border-radius:50% !important;"></span>
            </div>
            <div style="display:block !important;">
              <div style="font-weight:700 !important; font-size:16px !important; color:#ffffff !important; font-family:'Inter',sans-serif !important; line-height:1.2 !important; margin:0 !important;">${widget.name}</div>
              <div style="font-size:12px !important; color:rgba(255,255,255,0.85) !important; font-family:'Inter',sans-serif !important; line-height:1.2 !important; margin-top:2px !important; font-weight:500 !important;">Online · Support Team</div>
            </div>
          </div>
          <div style="font-size:13px !important; color:rgba(255,255,255,0.95) !important; font-family:'Inter',sans-serif !important; line-height:1.4 !important; font-weight:400 !important; margin-top:12px !important;">
            ${widget.greeting || "Hi! How can we help you today?"}
          </div>
          <div onclick="toggleBccChat()" style="position:absolute !important; top:20px !important; right:20px !important; background:transparent !important; border:none !important; color:#ffffff !important; font-size:22px !important; cursor:pointer !important; opacity:0.8 !important; outline:none !important; padding:0 !important; margin:0 !important; width:auto !important; height:auto !important; line-height:1 !important;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8">×</div>
        </div>

        <!-- Channels list -->
        <div style="padding:20px !important; display:flex !important; flex-direction:column !important; gap:10px !important; max-height:300px !important; overflow-y:auto !important; box-sizing:border-box !important; background:#ffffff !important;">
          ${channelsHtml}
        </div>

        <!-- Branding footer -->
        <div style="padding:12px 20px !important; text-align:center !important; font-size:11px !important; color:#94a3b8 !important; border-top:1px solid #f1f5f9 !important; background:#fafafa !important; font-family:'Inter',sans-serif !important; font-weight:500 !important; display:block !important; line-height:1.2 !important; box-sizing:border-box !important;">
          Powered by Bcc Crm
        </div>

        <!-- Live Chat Sub-view (Initially Hidden) -->
        <div id="bcc-live-chat-panel" style="display:none !important; position:absolute !important; top:0 !important; left:0 !important; width:100% !important; height:100% !important; background:#ffffff !important; flex-direction:column !important; z-index:100 !important; box-sizing:border-box !important;">
          <div style="background:${widget.brandColor || "#3b82f6"} !important; color:#ffffff !important; padding:16px !important; display:flex !important; align-items:center !important; gap:12px !important; box-sizing:border-box !important;">
            <div onclick="closeLiveChatPopup()" style="background:transparent !important; border:none !important; color:#ffffff !important; font-size:20px !important; cursor:pointer !important; outline:none !important; padding:0 !important; margin:0 !important; width:auto !important; height:auto !important;">←</div>
            <div style="font-weight:700 !important; font-size:15px !important; font-family:'Inter',sans-serif !important; color:#ffffff !important; text-transform:none !important;">Live Chat</div>
          </div>
          <div id="bcc-chat-messages" style="flex:1 !important; padding:16px !important; overflow-y:auto !important; display:flex !important; flex-direction:column !important; gap:12px !important; background:#f8fafc !important; font-size:13px !important; box-sizing:border-box !important;">
            <div style="background:#ffffff !important; border:1px solid #e2e8f0 !important; padding:10px 14px !important; border-radius:12px !important; max-width:85% !important; align-self:flex-start !important; color:#1e293b !important; line-height:1.4 !important; font-family:'Inter',sans-serif !important; text-align:left !important; box-sizing:border-box !important;">
              ${widget.greeting || "Hello! How can we help you?"}
            </div>
          </div>
          <div style="padding:12px !important; border-top:1px solid #e2e8f0 !important; display:flex !important; gap:8px !important; box-sizing:border-box !important; background:#ffffff !important;">
            <input id="bcc-chat-input" type="text" placeholder="Type a message..." style="flex:1 !important; padding:8px 12px !important; border:1px solid #cbd5e1 !important; border-radius:8px !important; font-size:13px !important; outline:none !important; font-family:'Inter',sans-serif !important; background:#ffffff !important; color:#1e293b !important; box-sizing:border-box !important; height:auto !important;" onkeypress="handleBccChatKey(event)" />
            <div onclick="sendBccChatMessage()" style="background:${widget.brandColor || "#3b82f6"} !important; color:#ffffff !important; border:none !important; border-radius:8px !important; padding:10px 16px !important; cursor:pointer !important; font-weight:700 !important; font-size:13px !important; outline:none !important; font-family:'Inter',sans-serif !important; height:38px !important; box-sizing:border-box !important; display:flex !important; align-items:center !important; justify-content:center !important;">Send</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

const GrapesJSBuilder = ({
  activeWebsite = {},
  activePage = {},
  activePost = {},
  mode = "page",
  setEditingPage,
  onSave,
}) => {
  const isPostMode = mode === "post";
  const editorRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  // In-page save confirmation. We show this instead of relying only on antd's
  // static `message` API — on this full-screen builder route the message
  // toast can end up rendered but visually stuck behind/outside the builder's
  // canvas, so it only becomes visible after navigating away (e.g. back to
  // the Websites page). Rendering our own banner inside this component
  // guarantees it shows right here, right after Save Changes is clicked.
  const [saveToast, setSaveToast] = useState(null); // { type: 'success' | 'error', text: string } | null
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  // Post title / excerpt / featured image are no longer separate React
  // inputs — they live as real, editable GrapesJS components inside the
  // canvas (see the "Post" block category below). These are just the
  // initial/fallback values used to seed the canvas and as a fallback on save.
  const initialPostTitle = activePost?.title || "";
  const initialPostExcerpt = activePost?.excerpt || "";
  const initialPostFeaturedImageUrl = activePost?.featuredImageUrl || "";
  const [chatWidgets, setChatWidgets] = useState([]);
  const [selectedChatWidgetId, setSelectedChatWidgetId] = useState(
    activeWebsite.chatWidgetId || "none",
  );
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [savingWidget, setSavingWidget] = useState(false);
  const [assignedWidget, setAssignedWidget] = useState(null);
  // Posts created/edited in this builder default to "draft" on the backend
  // (BlogPostSchema.status default) and previously had no way to be
  // published from here — handleSave() never sent a `status` field, so
  // every post saved through this editor stayed a draft forever. Public
  // blog embeds (`/api/blogs/:id/public`, used by the "Blogs" block you
  // drag onto a page) only return posts with status "published", so those
  // posts silently never appeared in the page editor's Blog List block —
  // even though the individual Post Preview button (which reads the post
  // back unfiltered) showed them fine. This toggle + the status field
  // added to the save payload below closes that gap.
  const [postStatus, setPostStatus] = useState(activePost?.status || "draft");
  // Meta Title / Meta Description have no on-canvas representation (unlike
  // Title/Excerpt/Image, which are draggable data-post-field components),
  // so they were previously never included in this editor's save payload —
  // meaning any post edited here silently lost/never got these fields, even
  // if they'd been set earlier through the Blogs admin form. Tracking them
  // here and sending them on save closes that gap.
  const [postMetaTitle, setPostMetaTitle] = useState(activePost?.metaTitle || "");
  const [postMetaDescription, setPostMetaDescription] = useState(activePost?.metaDescription || "");
  const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // loadForms/loadBlogs/loadQRs below are async (they await a fetch, and
    // loadBlogs awaits a fetch per-blog on top of that) and call
    // `e.BlockManager.add(...)` once the data comes back. If this effect's
    // cleanup runs first — e.g. React re-running the effect (StrictMode
    // double-invokes effects in dev), or the user navigating away/switching
    // pages before the fetch resolves — `e.destroy()` has already torn down
    // the editor, `e.BlockManager` is gone, and the `.add()` call throws
    // "Cannot read properties of undefined (reading 'add')". `destroyed`
    // lets every loader check, right before each `.add()` call, whether
    // that's already happened and bail out quietly instead of crashing.
    let destroyed = false;

    const e = grapesjs.init({
      container: editorRef.current,
      fromElement: true,
      height: "100%",
      width: "auto",
      storageManager: false, // We'll handle saving manually
      assetManager: {
        custom: {
          open() {
            setIsMediaModalOpen(true);
          },
          close() {
            setIsMediaModalOpen(false);
          },
        },
      },
      plugins: [webpagePlugin],
      pluginsOpts: {
        "grapesjs-preset-webpage": {
          // options for the preset
        },
      },
      canvas: {
        styles: [
          // Basic reset or custom styles
          "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        ],
      },
    });

    // Load initial HTML/CSS if it exists
    const sourceContent = isPostMode ? activePost : activePage;
    if (sourceContent.html || sourceContent.css) {
      e.setComponents(sourceContent.html || "");
      e.setStyle(sourceContent.css || "");
    } else if (isPostMode) {
      // Default post template — Title / Featured Image / Excerpt are real
      // GrapesJS components (marked with data-post-field) so they're edited
      // directly on the canvas, the same as any other element.
      e.setComponents(`
        <div style="padding: 50px 40px; max-width: 820px; margin: 0 auto; font-family: Inter, sans-serif;">
          <img data-post-field="image" src="${initialPostFeaturedImageUrl || "https://placehold.co/800x400?text=Featured+Image"}" alt="Featured image" style="width:100%; max-height:360px; object-fit:cover; border-radius:12px; margin-bottom:28px;" />
          <h1 data-post-field="title" style="font-size:36px; font-weight:800; line-height:1.2; margin:0 0 14px; color:#0f172a;">${initialPostTitle || "Post title"}</h1>
          <p data-post-field="excerpt" style="font-size:17px; color:#64748b; line-height:1.6; margin:0 0 32px;">${initialPostExcerpt || "A short summary shown in blog listings."}</p>
          <div style="font-size:16px; line-height:1.8; color:#1e293b;">
            <p>Start writing your blog post content here, or drag more blocks in from the panel.</p>
          </div>
        </div>
      `);
    } else {
      // Default empty template
      e.setComponents(
        '<div style="padding: 50px; text-align: center; font-family: Inter, sans-serif;"><h1>Welcome to M1 Growth platform Builder</h1><p>Start dragging blocks from the right panel to build your page!</p></div>',
      );
    }

    setEditor(e);

    // Fetch forms and register them as GrapesJS blocks
    const loadForms = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/forms", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();

        if (destroyed) return;

        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((form) => {
            if (destroyed) return;
            const embedUrl = `${window.location.origin}/embed/form/${form._id}`;
            const iframeCode = `<iframe src="${embedUrl}" title="${form.name}" style="width:100%; height:520px; border:0; border-radius:16px;"></iframe>`;

            e.BlockManager.add(`form-${form._id}`, {
              label: form.name,
              category: "Forms",
              content: iframeCode,
              attributes: { class: "fa fa-wpforms" }, // simple icon representation
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch forms for GrapesJS", err);
      }
    };

    // Build one post card's markup — same fields/behavior as before
    // (categories, full excerpt, "Read More" link, date + author), just
    // recolored/restyled to the indigo "Our latest blogs" theme.
    const buildBlogPostCardHtml = (blog, post) => {
      const postUrl = `/blog/${blog.slug}/${post.slug}`;
<<<<<<< HEAD
=======
      // "Read More" must open the post's actual saved html/css exactly as
      // built in the GrapesJS post editor — same route the "Preview" button
      // uses (see BlogEmbedView.jsx for the same pattern). The generic
      // /blog/:slug/:postSlug route renders a templated view from
      // post.content/excerpt and does NOT reflect the GrapesJS-edited page,
      // so it's kept only as a fallback for posts with no linked website.
      const postWebsiteId = post.websiteId || blog.websiteId;
      const postPreviewUrl = postWebsiteId
        ? `/preview/website/${postWebsiteId}/blog-post/${post._id}`
        : postUrl;
>>>>>>> b44416c608102f593c67f2e8f6359133e0a5703d
      const excerptHtml =
        post.excerpt?.trim() ||
        (post.content
          ? post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
          : "") ||
        "Read the full post for more details.";
      const dateStr = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "";
      const categoriesHtml =
        post.categories && post.categories.length
          ? `<div style="margin-bottom:16px;">${post.categories
              .map(
                (cat) =>
                  `<span style="display:inline-block; background:#eef2ff; color:#5b5fef; border-radius:4px; padding:2px 10px; font-size:12px; font-weight:600; margin-right:6px;">${cat}</span>`,
              )
              .join("")}</div>`
          : "";
      const imageHtml = post.featuredImageUrl
        ? `<a href="${postUrl}" target="_parent"><img src="${post.featuredImageUrl}" alt="${post.title}" style="width:100%; height:190px; object-fit:cover; display:block; border-radius:16px;" /></a>`
        : `<div style="width:100%; height:190px; border-radius:16px; background:#f1f5f9;"></div>`;

      return `
<<<<<<< HEAD
        <div data-post-card-id="${post._id}" style="flex:1 1 260px; max-width:340px;">
=======
        <div data-post-card-id="${post._id}" style="flex:0 0 280px; width:280px;">
>>>>>>> b44416c608102f593c67f2e8f6359133e0a5703d
          ${imageHtml}
          <div style="margin-top:20px;">
            ${categoriesHtml}
            <h4 style="margin:0 0 10px; font-weight:700; font-size:17px; line-height:1.4;">
              <a href="${postUrl}" target="_parent" style="color:#5b5fef; text-decoration:none;">${post.title}</a>
            </h4>
            <p style="color:#94a3b8; font-size:14px; line-height:1.6; margin:0 0 16px;">${excerptHtml}</p>
<<<<<<< HEAD
            <a href="${postUrl}" target="_parent" style="font-weight:700; font-size:14px; color:#5b5fef; text-decoration:none; display:inline-block; margin-bottom:16px;">Read More &rarr;</a>
=======
            <a href="${postPreviewUrl}" target="_blank" rel="noopener noreferrer" style="font-weight:700; font-size:14px; color:#5b5fef; text-decoration:none; display:inline-block; margin-bottom:16px;">Read More &rarr;</a>
>>>>>>> b44416c608102f593c67f2e8f6359133e0a5703d
            <div style="display:flex; align-items:center; gap:16px; color:#94a3b8; font-size:13px; font-weight:500;">
              <span>${dateStr}</span>
              <span>Admin</span>
            </div>
          </div>
        </div>
      `;
    };

    // Fetch blogs and register them as GrapesJS blocks.
    //
    // NOTE: this used to drop an <iframe src="/embed/blog/:id"> onto the
    // canvas and let that iframe fetch its own post data client-side. That
    // looked fine in a real page load (Preview / the live site), because a
    // top-level or srcdoc page load gets time to let the fetch resolve
    // before anything else touches the DOM. But the GrapesJS canvas itself
    // is constantly re-rendering as you select components, open panels,
    // undo/redo, etc. — every one of those can reload the nested iframe
    // before its fetch finishes, so only markup that didn't depend on the
    // fetch (the blog's static title) ever made it on-canvas, and the post
    // list stayed permanently blank while editing even though it rendered
    // fine anywhere the page was loaded normally.
    //
    // Fix: fetch each blog's actual published posts once, up front, and
    // bake the real title/image/excerpt/date into the block's HTML as
    // plain GrapesJS components — the same content, the same fields the
    // live site shows, just no runtime fetch inside the canvas to race.
    // This does mean the block is a snapshot at drop-time: publishing a
    // new post later won't retroactively appear on pages that already
    // have this block saved — dragging a fresh copy of the block (or
    // re-dragging it in) picks up whatever is published at that moment.
    const loadBlogs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/blogs", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();

        if (destroyed) return;

        if (data.success && Array.isArray(data.data)) {
          await Promise.all(
            data.data.map(async (blog) => {
              let posts = [];
              try {
                const postsRes = await fetch(`/api/blogs/${blog._id}/public`);
                const postsData = await postsRes.json();
                if (postsData.success && postsData.data) {
                  posts = (postsData.data.posts || []).slice(0, 3);
                }
              } catch (postsErr) {
                console.error(
                  `Failed to fetch posts for blog ${blog._id}`,
                  postsErr,
                );
              }

              if (destroyed) return;

              const postsHtml = posts.length
                ? posts.map((post) => buildBlogPostCardHtml(blog, post)).join("")
                : `<div style="text-align:center; padding:60px 20px; background:#f8fafc; border-radius:16px; width:100%;">
                     <h4 style="color:#64748b; margin:0 0 8px;">No posts published yet.</h4>
                     <p style="color:#94a3b8; margin:0;">Check back later for updates!</p>
                   </div>`;

              const blogListUrl = `/blog/${blog.slug}`;

<<<<<<< HEAD
=======
              // Posts scroll horizontally in a single row instead of wrapping
              // onto new lines — data-blog-scroll-id gives the arrow buttons
              // below a stable target to scroll via scrollBy(), and
              // overflow-x:hidden keeps anything past the visible strip out
              // of view until the user scrolls it into place.
              const scrollId = `blog-scroll-${blog._id}`;

>>>>>>> b44416c608102f593c67f2e8f6359133e0a5703d
              const blockContent = `
                <div data-blog-list-id="${blog._id}" style="max-width:1200px; margin:0 auto; padding:60px 20px; font-family:inherit;">
                  <div style="display:flex; gap:60px; align-items:flex-start; flex-wrap:wrap;">
                    <div style="flex:0 0 280px; max-width:320px;">
                      <h2 style="font-weight:800; margin:0 0 16px; font-size:32px; color:#0f172a; line-height:1.2;">${blog.name.split(" ").slice(0, -1).join(" ") || "Our latest"} <span style="color:#5b5fef;">${blog.name.split(" ").slice(-1)[0] || "blogs"}</span></h2>
                      <p style="font-size:14px; color:#94a3b8; line-height:1.6; margin:0 0 28px;">${blog.description || "Welcome to our blog section, where knowledge meets inspiration. Explore insightful articles, expert tips, and the latest trends in our field."}</p>
                      <a href="${blogListUrl}" target="_parent" style="display:inline-block; padding:12px 28px; border:1px solid #e2e8f0; border-radius:999px; color:#0f172a; font-weight:600; font-size:14px; text-decoration:none; margin-bottom:56px;">View All</a>
                      <div style="display:flex; gap:12px;">
<<<<<<< HEAD
                        <span style="width:40px; height:40px; border-radius:50%; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#0f172a; font-size:16px;">&larr;</span>
                        <span style="width:40px; height:40px; border-radius:50%; background:#5b5fef; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:16px;">&rarr;</span>
                      </div>
                    </div>
                    <div style="flex:1 1 480px; display:flex; flex-wrap:wrap; gap:32px;">
=======
                        <span onclick="document.getElementById('${scrollId}') && document.getElementById('${scrollId}').scrollBy({left:-312,behavior:'smooth'})" style="width:40px; height:40px; border-radius:50%; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#0f172a; font-size:16px; cursor:pointer; user-select:none;">&larr;</span>
                        <span onclick="document.getElementById('${scrollId}') && document.getElementById('${scrollId}').scrollBy({left:312,behavior:'smooth'})" style="width:40px; height:40px; border-radius:50%; background:#5b5fef; display:flex; align-items:center; justify-content:center; color:#ffffff; font-size:16px; cursor:pointer; user-select:none;">&rarr;</span>
                      </div>
                    </div>
                    <div id="${scrollId}" style="flex:1 1 480px; min-width:0; display:flex; flex-wrap:nowrap; gap:32px; overflow-x:hidden; scroll-behavior:smooth;">
>>>>>>> b44416c608102f593c67f2e8f6359133e0a5703d
                      ${postsHtml}
                    </div>
                  </div>
                </div>
              `;

              if (destroyed) return;

              e.BlockManager.add(`blog-${blog._id}`, {
                label: blog.name,
                category: "Blogs",
                content: blockContent,
                attributes: { class: "fa fa-newspaper-o" }, // FontAwesome newspaper icon
              });
            }),
          );
        }
      } catch (err) {
        console.error("Failed to fetch blogs for GrapesJS", err);
      }
    };

    // Fetch QR links and register them as GrapesJS blocks
    const loadQRs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/qrs", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();

        if (destroyed) return;

        if (data.success && Array.isArray(data.data)) {
          data.data.forEach((qr) => {
            if (destroyed) return;
            const embedUrl = `${window.location.origin}/embed/qr/${qr._id}`;
            const iframeCode = `<iframe src="${embedUrl}" title="${qr.name}" style="width:220px; height:240px; border:0; border-radius:16px; overflow:hidden;" scrolling="no"></iframe>`;

            e.BlockManager.add(`qr-${qr._id}`, {
              label: qr.name,
              category: "QR Links",
              content: iframeCode,
              attributes: { class: "fa fa-qrcode" },
            });
          });
        }
      } catch (err) {
        console.error("Failed to fetch QRs for GrapesJS", err);
      }
    };

    // In post mode we only want the post itself (title/image/excerpt + basic
    // content blocks) — not the Forms / QR Links / Blogs embed categories,
    // which are page-level concerns and don't belong inside a single post.
    if (!isPostMode) {
      loadForms();
      loadBlogs();
      loadQRs();
    } else {
      // Register Title / Featured Image / Excerpt as draggable GrapesJS
      // blocks under a dedicated "Post" category. They're plain components
      // marked with data-post-field so they can be dragged in, edited
      // in-canvas like anything else, and read back out on save.
      e.BlockManager.add("post-title-block", {
        label: "Post Title",
        category: "Post",
        content: `<h1 data-post-field="title" style="font-size:36px; font-weight:800; line-height:1.2; margin:0 0 14px; color:#0f172a;">Post title</h1>`,
        attributes: { class: "fa fa-header" },
      });
      e.BlockManager.add("post-featured-image-block", {
        label: "Featured Image",
        category: "Post",
        content: `<img data-post-field="image" src="https://placehold.co/800x400?text=Featured+Image" alt="Featured image" style="width:100%; max-height:360px; object-fit:cover; border-radius:12px;" />`,
        attributes: { class: "fa fa-image" },
      });
      e.BlockManager.add("post-excerpt-block", {
        label: "Excerpt",
        category: "Post",
        content: `<p data-post-field="excerpt" style="font-size:17px; color:#64748b; line-height:1.6;">A short summary shown in blog listings.</p>`,
        attributes: { class: "fa fa-align-left" },
      });

      // FAQ Section — a container (data-post-field="faq") holding repeatable
      // .faq-item blocks, each with a data-faq-question / data-faq-answer
      // pair. Both are read back out into a structured faqs[] array on save.
      // The badge/heading/subtitle above the list are plain text — editable
      // in-canvas like any other component — and aren't read back out on
      // save; they're just the section's default look.
      //
      // Accordion behavior uses native <details>/<summary> — no JS and no
      // stylesheet rules needed, both of which are unreliable here: <script>
      // tags inserted via dangerouslySetInnerHTML never execute on the live
      // published post page, and that page only renders the saved `html`,
      // not the saved `css` (see BlogPostEmbedView), so class-based CSS
      // rules would show correctly in this editor but silently vanish once
      // published. Everything below is inline styles + a plain "+" glyph,
      // which travels safely with the HTML wherever it's rendered.
      //
      // NOTE: the first item is dropped in with the `open` attribute set, so
      // its answer stays visible and directly editable in the canvas
      // (clicking a collapsed summary here just selects/toggles the
      // component rather than reliably opening it for text editing).
      // `open` is stripped back out on save (see handleSave) so the
      // *published* post still starts fully collapsed for readers.
      const faqItemHtml = (question, answer, open) => `
            <details class="faq-item" ${open ? "open" : ""} style="background:#ffffff; border-radius:14px; box-shadow:0 1px 3px rgba(15,23,42,0.06); padding:20px 24px;">
              <summary style="list-style:none; cursor:pointer; margin:0; display:flex; align-items:center; justify-content:space-between; gap:16px;">
                <span data-faq-question style="font-weight:700; font-size:15px; color:#0f172a;">${question}</span>
                <span style="flex-shrink:0; width:28px; height:28px; border-radius:50%; background:#0f172a; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:300; line-height:1;">+</span>
              </summary>
              <div data-faq-answer style="font-size:13px; color:#94a3b8; line-height:1.6; margin-top:12px;">${answer}</div>
            </details>
      `;

      e.BlockManager.add("post-faq-section-block", {
        label: "FAQ Section",
        category: "Post",
        content: `
          <div data-post-field="faq" style="margin-top:48px; padding:56px 20px; text-align:center; font-family:inherit;">
            <div style="display:inline-flex; align-items:center; gap:8px; background:#ffffff; border:1px solid #e2e8f0; padding:4px 6px 4px 4px; border-radius:20px; margin-bottom:24px;">
              <span style="background:#5b5fef; color:#ffffff; font-weight:700; font-size:11px; padding:4px 12px; border-radius:16px;">Brand</span>
              <span style="color:#0f172a; font-weight:700; font-size:11px; padding-right:6px; letter-spacing:0.5px;">FAQ</span>
            </div>
            <h2 style="font-size:36px; font-weight:800; margin:0 0 12px; color:#0f172a; line-height:1.2;">Frequently answer <span style="color:#5b5fef;">questions</span></h2>
            <p style="font-size:14px; color:#94a3b8; margin:0 0 40px;">Manage it all with a fully customizable, no code platform</p>
            <div style="max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:16px; text-align:left;">
              ${faqItemHtml(
                "What is Customer Relationship Management (CRM)?",
                "Customer Relationship Management (CRM) is a platform that helps companies manage interactions with current and potential customers. CRM software enhances customer relationships by connecting with customers, streamlining activities, and improving retention.",
                true,
              )}
              ${faqItemHtml("What is CRM Software Used For?", "Its answer.", false)}
              ${faqItemHtml("Manage your finances from any device", "Its answer.", false)}
            </div>
          </div>
        `,
        attributes: { class: "fa fa-question-circle" },
      });
      e.BlockManager.add("post-faq-item-block", {
        label: "FAQ Item",
        category: "Post",
        content: faqItemHtml("Another question?", "Its answer.", true),
        attributes: { class: "fa fa-plus-square" },
      });
    }

    // Hide common HTML template preloaders/spinners inside the canvas
    e.on("load", () => {
      try {
        const doc = e.Canvas.getDocument();
        if (doc) {
          const style = doc.createElement("style");
          style.innerHTML = `
            /* Hide preloaders in builder so they don't block the canvas */
            #spinner, #preloader, .preloader, .loader-wrapper, .loader {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
            /* Specific Bootstrap 5 spinner overlay used in many templates */
            div.show.bg-white.position-fixed.translate-middle.w-100.vh-100 {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          `;
          doc.head.appendChild(style);
        }
      } catch (err) {
        console.error("Error injecting canvas styles", err);
      }

      // Add 'src' to the image component's traits so it's easily editable in the Settings panel
      try {
        const domc = e.DomComponents;
        const imgType = domc.getType("image");
        if (imgType) {
          domc.addType("image", {
            model: {
              defaults: {
                traits: [
                  {
                    type: "text",
                    label: "Image URL",
                    name: "src",
                    placeholder: "https://example.com/image.jpg",
                  },
                  {
                    type: "text",
                    label: "Alt Text",
                    name: "alt",
                    placeholder: "eg. Text here",
                  },
                ],
              },
            },
          });
        }
      } catch (err) {
        console.error("Error updating image traits", err);
      }
    });

    e.on("component:selected", (component) => {
      setSelectedComponent(component);
    });

    e.on("component:deselected", () => {
      setSelectedComponent(null);
    });

    e.on("run:core:preview", () => setIsPreviewing(true));
    e.on("stop:core:preview", () => setIsPreviewing(false));

    return () => {
      destroyed = true;
      e.destroy();
    };
  }, [activePage.html, activePage.css, activePost?.html, activePost?.css]);

  useEffect(() => {
    const fetchWidgets = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/chat-widgets", {
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        });
        const data = await res.json();
        if (data.success) {
          setChatWidgets(data.data);
          const current = data.data.find(
            (w) => w._id === activeWebsite.chatWidgetId,
          );
          if (current) {
            setAssignedWidget(current);
          }
        }
      } catch (err) {
        console.error("Failed to fetch widgets", err);
      }
    };
    fetchWidgets();
  }, [activeWebsite.chatWidgetId]);

  const injectChatWidgetToCanvas = (editorInstance, widget) => {
    if (!editorInstance) return;
    const doc = editorInstance.Canvas.getDocument();
    if (!doc) return;

    // Remove existing if any
    const existing = doc.getElementById("bcc-chat-widget");
    if (existing) existing.remove();
    const existingScript = doc.getElementById("bcc-chat-widget-script");
    if (existingScript) existingScript.remove();
    const existingContainer = doc.getElementById("bcc-chat-widget-container");
    if (existingContainer) existingContainer.remove();

    if (!widget) return;

    // Inject Inter font into canvas head if not already there
    if (
      !doc.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')
    ) {
      const fontLink = doc.createElement("link");
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap";
      fontLink.rel = "stylesheet";
      doc.head.appendChild(fontLink);
    }

    // Add Widget HTML
    const widgetHtml = getWidgetHtmlOnly(widget);
    const container = doc.createElement("div");
    container.id = "bcc-chat-widget-container";
    container.innerHTML = widgetHtml;
    doc.body.appendChild(container);

    // Add Widget Script
    const scriptEl = doc.createElement("script");
    scriptEl.id = "bcc-chat-widget-script";
    scriptEl.textContent = `
      function toggleBccChat() {
        const win = document.getElementById('bcc-chat-window');
        if (!win) return;
        if (win.style.display === 'none' || win.style.display === '') {
          win.style.display = 'block';
          setTimeout(() => {
            win.style.transform = 'translateY(0)';
            win.style.opacity = '1';
          }, 10);
        } else {
          win.style.transform = 'translateY(10px)';
          win.style.opacity = '0';
          setTimeout(() => {
            win.style.display = 'none';
          }, 300);
        }
      }

      function openLiveChatPopup() {
        document.getElementById('bcc-live-chat-panel').style.display = 'flex';
      }

      function closeLiveChatPopup() {
        document.getElementById('bcc-live-chat-panel').style.display = 'none';
      }

      function handleBccChatKey(e) {
        if (e.key === 'Enter') {
          sendBccChatMessage();
        }
      }

      function sendBccChatMessage() {
        const inp = document.getElementById('bcc-chat-input');
        const text = inp.value.trim();
        if (!text) return;
        
        inp.value = '';
        const msgs = document.getElementById('bcc-chat-messages');
        
        // User message
        const userDiv = document.createElement('div');
        userDiv.style.cssText = 'background:${widget.brandColor || "#3b82f6"}; color:#fff; padding:10px 14px; border-radius:12px; max-width:85%; align-self:flex-end; line-height:1.4; font-family:"Inter",sans-serif;';
        userDiv.textContent = text;
        msgs.appendChild(userDiv);
        msgs.scrollTop = msgs.scrollHeight;

        // Mock bot reply after 1s
        setTimeout(() => {
          const botDiv = document.createElement('div');
          botDiv.style.cssText = 'background:#fff; border:1px solid #e2e8f0; padding:10px 14px; border-radius:12px; max-width:85%; align-self:flex-start; color:#1e293b; line-height:1.4; font-family:"Inter",sans-serif;';
          botDiv.textContent = "Thanks for your message! Our team will get back to you shortly.";
          msgs.appendChild(botDiv);
          msgs.scrollTop = msgs.scrollHeight;
        }, 1000);
      }
    `;
    doc.body.appendChild(scriptEl);
  };

  useEffect(() => {
    if (editor) {
      injectChatWidgetToCanvas(editor, assignedWidget);
      // Re-inject on load
      editor.on("load", () => {
        injectChatWidgetToCanvas(editor, assignedWidget);
      });
    }
  }, [editor, assignedWidget]);

  useEffect(() => {
    if (!saveToast) return;
    const timer = setTimeout(() => setSaveToast(null), 3000);
    return () => clearTimeout(timer);
  }, [saveToast]);

  const handleSaveWidgetAssignment = async () => {
    try {
      setSavingWidget(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/websites/${activeWebsite.key || activeWebsite._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            chatWidgetId:
              selectedChatWidgetId === "none" ? null : selectedChatWidgetId,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        message.success("Chat widget assigned successfully!");
        activeWebsite.chatWidgetId =
          selectedChatWidgetId === "none" ? null : selectedChatWidgetId;
        const currentWidget = chatWidgets.find(
          (w) => w._id === selectedChatWidgetId,
        );
        setAssignedWidget(currentWidget || null);
        setIsChatModalOpen(false);
      } else {
        message.error(data.error || "Failed to save widget assignment");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving widget assignment");
    } finally {
      setSavingWidget(false);
    }
  };

  const handleSave = async () => {
    if (!editor) return;

    const html = editor.getHtml();
    const css = editor.getCss();

    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      if (isPostMode) {
        // Pull title / excerpt / featured image straight out of the canvas —
        // they're real components (data-post-field="...") the user edited
        // in place, not separate form inputs.
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const titleEl = doc.querySelector('[data-post-field="title"]');
        const excerptEl = doc.querySelector('[data-post-field="excerpt"]');
        const imageEl = doc.querySelector('[data-post-field="image"]');

        const title = titleEl
          ? titleEl.textContent.trim()
          : initialPostTitle;
        const excerpt = excerptEl
          ? excerptEl.textContent.trim()
          : initialPostExcerpt;
        const featuredImageUrl = imageEl
          ? imageEl.getAttribute("src") || ""
          : initialPostFeaturedImageUrl;

        // FAQ items are optional — walk every .faq-item inside the FAQ
        // Section component and pull out its question/answer text.
        const faqs = [];
        const faqSection = doc.querySelector('[data-post-field="faq"]');
        if (faqSection) {
          faqSection.querySelectorAll(".faq-item").forEach((item) => {
            const qEl = item.querySelector("[data-faq-question]");
            const aEl = item.querySelector("[data-faq-answer]");
            const question = qEl ? qEl.textContent.trim() : "";
            const answer = aEl ? aEl.textContent.trim() : "";
            if (question || answer) faqs.push({ question, answer });
          });
        }

        // FAQ blocks are dropped in with `open` set so the answer stays
        // visible/editable in the canvas (see the block definitions above).
        // Strip it back out here so the published post renders collapsed —
        // readers get the accordion, the "open" attribute was purely an
        // editing convenience and was never meant to reach the live page.
        doc.querySelectorAll(".faq-item[open]").forEach((item) => {
          item.removeAttribute("open");
        });
        const finalHtml = doc.body.innerHTML;

        if (!title) {
          setSaveToast({ type: "error", text: "Add a Post Title block with some text before saving." });
          setSaving(false);
          return;
        }

        const res = await fetch(`/api/blogs/posts/${activePost._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            html: finalHtml,
            css,
            title,
            excerpt,
            featuredImageUrl,
            faqs,
            status: postStatus,
            metaTitle: postMetaTitle,
            metaDescription: postMetaDescription,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setSaveToast({
            type: "success",
            text:
              postStatus === "published"
                ? "Blog post saved and published!"
                : "Blog post saved as draft. Switch to \"Published\" and save again to make it appear in Blog List blocks."
          });
          onSave(data.data);
        } else {
          setSaveToast({ type: "error", text: data.error || "Failed to save blog post" });
        }
        return;
      }

      const res = await fetch(
        `/api/websites/${activeWebsite.key}/pages/${activePage._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ html, css }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSaveToast({ type: "success", text: "Page saved successfully!" });
        onSave(data.data);
      } else {
        setSaveToast({ type: "error", text: data.error || "Failed to save page" });
      }
    } catch (err) {
      console.error(err);
      setSaveToast({ type: "error", text: "An error occurred while saving" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`builder-container ${isPreviewing ? "is-previewing" : ""}`}
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Save confirmation banner — deliberately position: fixed with a very high
          z-index so it's never hidden behind the GrapesJS canvas/panels, and shows
          right here on the builder screen instead of only appearing once the user
          navigates back to the Websites page. */}
      {saveToast && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: saveToast.type === "success" ? "#16a34a" : "#dc2626",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          {saveToast.text}
        </div>
      )}

      {/* Custom Premium Top Bar */}
      {!isPreviewing && (
        <div
          style={{
            height: "60px",
            background: "#0f172a", // Deep Navy from reference
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              onClick={() => setEditingPage(null)}
              style={{
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                fontWeight: 600,
                padding: "4px 8px",
                borderRadius: 6,
              }}
            >
              Back
            </Button>
            <div
              style={{
                width: 1,
                height: 24,
                background: "rgba(255,255,255,0.1)",
              }}
            ></div>
            <div
              style={{
                fontWeight: 800,
                color: "#f8fafc",
                fontSize: 15,
                letterSpacing: 0.3,
              }}
            >
              M1 Growth platform Builder:{" "}
              <span style={{ color: "#3b82f6" }}>
                {isPostMode ? activePost.title : activePage.title}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isPostMode && (
              <Button
                type="default"
                onClick={() => setIsChatModalOpen(true)}
                style={{
                  background: "#1e293b",
                  color: "#cbd5e1",
                  borderColor: "#334155",
                  fontWeight: 600,
                  borderRadius: 6,
                  height: 36,
                }}
              >
                Chat Widget
              </Button>
            )}
            {isPostMode && (
              <Button
                type="default"
                onClick={() => setIsSeoModalOpen(true)}
                style={{
                  background: "#1e293b",
                  color: "#cbd5e1",
                  borderColor: "#334155",
                  fontWeight: 600,
                  borderRadius: 6,
                  height: 36,
                }}
              >
                SEO
              </Button>
            )}
            {isPostMode && (
              <Select
                value={postStatus}
                onChange={(v) => setPostStatus(v)}
                style={{ width: 130, height: 36 }}
              >
                <Option value="draft">Draft</Option>
                <Option value="published">Published</Option>
              </Select>
            )}
            <Button
              type="primary"
              onClick={handleSave}
              loading={saving}
              style={{
                background: "#3b82f6",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                borderRadius: 6,
                padding: "0 20px",
                height: 36,
                boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Editor Container */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <div ref={editorRef} style={{ height: "100%" }}></div>

        {/* Custom Image Panel */}
        {!isPreviewing &&
          selectedComponent &&
          selectedComponent.is("image") && (
            <CustomImagePanel
              editor={editor}
              selectedComponent={selectedComponent}
              onClose={() => editor.select(null)}
              onOpenMedia={() => setIsMediaModalOpen(true)}
            />
          )}
      </div>

      <MediaStorageModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelectImage={(url) => {
          if (selectedComponent && selectedComponent.is("image")) {
            selectedComponent.addAttributes({ src: url });
          } else {
            // If they opened Asset Manager without selecting image (e.g. from top bar), GrapesJS expects asset to be added
            editor.AssetManager.add(url);
          }
          setIsMediaModalOpen(false);
        }}
      />

      <Modal
        title={
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              color: "var(--text-primary)",
            }}
          >
            Chat Widget Assignment
          </div>
        }
        open={isChatModalOpen}
        onCancel={() => setIsChatModalOpen(false)}
        footer={[
          <Button
            key="back"
            onClick={() => setIsChatModalOpen(false)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={savingWidget}
            onClick={handleSaveWidgetAssignment}
            style={{
              background: "var(--accent-primary)",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Save Assignment
          </Button>,
        ]}
        bodyStyle={{ padding: "24px 0 8px" }}
      >
        <div style={{ padding: "0 24px" }}>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Assign a chat widget to float on all pages of this website. Visitors
            will be able to engage with the channels configured in the widget.
          </div>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 8,
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          >
            Select Chat Widget
          </div>
          <Select
            value={selectedChatWidgetId || "none"}
            onChange={setSelectedChatWidgetId}
            style={{ width: "100%", marginBottom: 16 }}
            size="large"
          >
            <Option value="none">— None —</Option>
            {chatWidgets.map((w) => (
              <Option key={w._id} value={w._id}>
                {w.name} {w.status === "Draft" ? "(Draft)" : ""}
              </Option>
            ))}
          </Select>
          <div
            onClick={() => {
              setIsChatModalOpen(false);
              setEditingPage(null); // Go back to website detail view
            }}
            style={{
              color: "var(--accent-info)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Manage chat widgets in website dashboard →
          </div>
        </div>
      </Modal>

      {isPostMode && (
        <Modal
          title="Post SEO"
          open={isSeoModalOpen}
          onCancel={() => setIsSeoModalOpen(false)}
          footer={null}
          centered
          width={480}
        >
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 20 }}>
            These are saved together with the rest of the post when you click "Save Changes" —
            they won't appear on the canvas, only in search results and link previews.
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: "var(--text-primary)" }}>
              Meta Title
            </div>
            <Input
              size="large"
              value={postMetaTitle}
              onChange={(e) => setPostMetaTitle(e.target.value)}
              placeholder="Title shown in search engine results"
            />
          </div>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: "var(--text-primary)" }}>
              Meta Description
            </div>
            <Input.TextArea
              rows={3}
              value={postMetaDescription}
              onChange={(e) => setPostMetaDescription(e.target.value)}
              placeholder="Short description shown in search engine results"
            />
          </div>
        </Modal>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .gjs-cv-canvas {
          top: 0;
          width: 100%;
          height: 100%;
        }
        /* Make sure GrapesJS panels do not overlap our top bar incorrectly if we use default layout */
        .gjs-editor {
          height: 100% !important;
        }
      `,
        }}
      />
    </div>
  );
};

export default GrapesJSBuilder;