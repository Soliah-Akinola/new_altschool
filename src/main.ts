type CartItem = {
    id: number;
    name: string;
    price: number; // unit price
    qty: number;
    thumb: string;
  };
  
  const IMAGES = [
    "assets/image-product-1.jpg",
    "assets/image-product-2.jpg",
    "assets/image-product-3.jpg",
    "assets/image-product-4.jpg",
  ];
  
  const THUMBS = [
    "assets/image-product-1-thumbnail.jpg",
    "assets/image-product-2-thumbnail.jpg",
    "assets/image-product-3-thumbnail.jpg",
    "assets/image-product-4-thumbnail.jpg",
  ];
  
  const PRODUCT: Omit<CartItem, "qty"> = {
    id: 1,
    name: "Fall Limited Edition Sneakers",
    price: 125.0,
    thumb: THUMBS[0],
  };
  
  const $ = <T extends Element = Element>(sel: string, root: Document | Element = document) =>
    root.querySelector(sel) as T;
  const $$ = (sel: string, root: Document | Element = document) =>
    Array.from(root.querySelectorAll(sel));
  
  /* ---------- Drawer (mobile nav) ---------- */
  const drawer = $(".drawer") as HTMLElement;
  const openMenuBtn = $(".header__menu-btn") as HTMLButtonElement;
  const closeMenuBtn = $(".drawer__close") as HTMLButtonElement;
  const drawerBackdrop = $(".drawer__backdrop") as HTMLDivElement;
  
  openMenuBtn?.addEventListener("click", () => {
    drawer.removeAttribute("hidden");
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  });
  function closeDrawer() {
    drawer.setAttribute("hidden", "");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }
  closeMenuBtn?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);
  
  /* ---------- Gallery & Lightbox ---------- */
  let currentIndex = 0;
  
  const mainImage = $("#mainImage") as HTMLImageElement;
  const lb = $(".lightbox") as HTMLDivElement;
  const lbImage = $("#lightboxImage") as HTMLImageElement;
  
  function setImage(idx: number) {
    currentIndex = (idx + IMAGES.length) % IMAGES.length;
    mainImage.src = IMAGES[currentIndex];
    lbImage.src = IMAGES[currentIndex];
    // sync active thumbnails in both places
    for (const root of [document, lb]) {
      $$(".thumb", root).forEach((t) =>
        t.classList.toggle("is-active", Number((t as HTMLElement).dataset.index) === currentIndex)
      );
    }
  }
  
  $$(".gallery .thumb").forEach((btn) =>
    btn.addEventListener("click", () => setImage(Number((btn as HTMLElement).dataset.index)))
  );
  $(".gallery__nav--prev")?.addEventListener("click", () => setImage(currentIndex - 1));
  $(".gallery__nav--next")?.addEventListener("click", () => setImage(currentIndex + 1));
  
  function openLightbox() {
    if (!window.matchMedia("(min-width: 901px)").matches) return;
    lb.removeAttribute("hidden");
    document.body.classList.add("modal-open");
    // Ensure drawer isn't on top
    drawer.setAttribute("hidden", "");
  }
  function closeLightbox() {
    lb.setAttribute("hidden", "");
    document.body.classList.remove("modal-open");
  }
  
  mainImage.addEventListener("click", openLightbox);
  $(".lightbox__close")?.addEventListener("click", closeLightbox);
  $(".lightbox")?.addEventListener("click", (e) => {
    if (e.target === lb) closeLightbox(); // click backdrop to close
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeDrawer();
    }
  });
  $(".lightbox__nav--prev")?.addEventListener("click", () => setImage(currentIndex - 1));
  $(".lightbox__nav--next")?.addEventListener("click", () => setImage(currentIndex + 1));
  $$(".lightbox .thumb").forEach((btn) =>
    btn.addEventListener("click", () => setImage(Number((btn as HTMLElement).dataset.index)))
  );
  
  /* ---------- Quantity stepper ---------- */
  const qtyOut = $("#qty") as HTMLOutputElement;
  const minusBtn = $(".stepper__btn--minus") as HTMLButtonElement;
  const plusBtn = $(".stepper__btn--plus") as HTMLButtonElement;
  
  let qty = 0;
  const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
  function renderQty() { qtyOut.value = String(qty); }
  minusBtn.addEventListener("click", () => { qty = clamp(qty - 1, 0, 99); renderQty(); });
  plusBtn.addEventListener("click", () => { qty = clamp(qty + 1, 0, 99); renderQty(); });
  renderQty();
  
  /* ---------- Cart ---------- */
  const cartBtn = $(".cart-btn") as HTMLButtonElement;
  const cart = $(".cart") as HTMLDivElement;
  const badge = $(".cart-btn__badge") as HTMLSpanElement;
  const cartEmpty = $(".cart__empty") as HTMLDivElement;
  const cartFilled = $(".cart__filled") as HTMLDivElement;
  const cartList = $(".cart__list") as HTMLUListElement;
  
  let cartItems: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
  updateCartUI();
  
  cartBtn.addEventListener("click", () => {
    const expanded = cartBtn.getAttribute("aria-expanded") === "true";
    cartBtn.setAttribute("aria-expanded", String(!expanded));
    cart.toggleAttribute("hidden");
  });
  
  document.addEventListener("click", (e) => {
    const t = e.target as Node;
    if (cart && !cart.contains(t) && t !== cartBtn && !cartBtn.contains(t)) {
      cart.setAttribute("hidden", "");
      cartBtn.setAttribute("aria-expanded", "false");
    }
  });
  
  $(".add-to-cart")?.addEventListener("click", () => {
    if (qty === 0) return;
    const existing = cartItems.find((i) => i.id === PRODUCT.id);
    if (existing) existing.qty += qty;
    else cartItems.push({ ...PRODUCT, qty });
    qty = 0; renderQty();
    persist();
    updateCartUI();
    cart.removeAttribute("hidden");
    cartBtn.setAttribute("aria-expanded", "true");
  });
  
  function updateCartUI() {
    const totalQty = cartItems.reduce((a, b) => a + b.qty, 0);
    if (totalQty > 0) {
      badge.hidden = false;
      badge.textContent = String(totalQty);
      cartEmpty.hidden = true;
      cartFilled.hidden = false;
      renderCartList();
    } else {
      badge.hidden = true;
      cartFilled.hidden = true;
      cartEmpty.hidden = false;
    }
  }
  
  function renderCartList() {
    cartList.innerHTML = "";
    for (const item of cartItems) {
      const li = document.createElement("li");
      li.className = "cart__item";
      li.innerHTML = `
        <img class="cart__thumb" src="${item.thumb}" alt="">
        <div class="cart__meta">
          <div>${item.name}</div>
          <div>$${item.price.toFixed(2)} x ${item.qty} <span class="cart__total">$${(item.qty * item.price).toFixed(2)}</span></div>
        </div>
        <button class="cart__remove" aria-label="Remove">
          <svg class="icon"><use href="#icon-delete"/></svg>
        </button>
      `;
      li.querySelector<HTMLButtonElement>(".cart__remove")!.addEventListener("click", () => {
        cartItems = cartItems.filter((i) => i.id !== item.id);
        persist();
        updateCartUI();
      });
      cartList.appendChild(li);
    }
  }
  
  function persist() {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }
  
  /* Initial image state */
  setImage(0);
  