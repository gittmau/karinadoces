const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-navigation');

menuToggle?.addEventListener('click', () => {
    const isOpen = navigation.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navigation?.querySelectorAll('a, button').forEach((link) => {
    link.addEventListener('click', () => {
        navigation.classList.remove('is-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
    });
});

const filterButtons = document.querySelectorAll('.filter-button');
const productCards = document.querySelectorAll('.product-card');
const emptyProducts = document.querySelector('.empty-products');

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const selectedCategory = button.dataset.filter;
        let visibleProducts = 0;

        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;
            filterButton.classList.toggle('is-active', isActive);
            filterButton.setAttribute('aria-pressed', String(isActive));
        });

        productCards.forEach((card) => {
            const shouldShow = selectedCategory === 'todos' || card.dataset.category === selectedCategory;
            card.hidden = !shouldShow;
            if (shouldShow) visibleProducts += 1;
        });

        if (emptyProducts) emptyProducts.hidden = visibleProducts > 0;
    });
});

// Shopping Cart Functionality

const cartToggle = document.querySelector('.cart-toggle');
const orderToggle = document.querySelector('.nav-cta');
const cartPanel = document.querySelector('.cart-panel');
const cartBackdrop = document.querySelector('.cart-backdrop');
const cartItems = document.querySelector('.cart-items');
const cartEmpty = document.querySelector('.cart-empty');
const cartCount = document.querySelector('.cart-count');
const cartSubtotal = document.querySelector('.cart-subtotal');
const whatsappOrder = document.querySelector('#whatsapp-order');
const cart = new Map();
const cartStorageKey = 'docesKaahCart';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const whatsappNumber = '5511910870311';

const saveCart = () => {
    localStorage.setItem(cartStorageKey, JSON.stringify(Array.from(cart.entries())));
};

const loadCart = () => {
    const storedCart = localStorage.getItem(cartStorageKey);
    if (!storedCart) return;

    try {
        const parsedCart = JSON.parse(storedCart);
        if (!Array.isArray(parsedCart)) return;
        parsedCart.forEach(([id, item]) => {
            if (item && typeof item.name === 'string' && Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0) {
                cart.set(id, item);
            }
        });
    } catch {
        localStorage.removeItem(cartStorageKey);
    }
};

const buildWhatsAppMessage = () => {
    const lines = ['Olá! Gostaria de fazer uma encomenda na Doces da Kaah:', ''];
    let subtotal = 0;
    cart.forEach((item) => {
        const total = item.price * item.quantity;
        subtotal += total;
        lines.push(`- ${item.name} | ${item.quantity} un. | ${currency.format(total)}`);
    });
    lines.push('', `Subtotal demonstrativo: ${currency.format(subtotal)}`, '', 'Mensagem gerada pelo catálogo demonstrativo.');
    return lines.join('\n');
};

const renderCart = () => {
    let itemCount = 0;
    let subtotal = 0;

    cartItems.innerHTML = '';
    cart.forEach((item, id) => {
        itemCount += item.quantity;
        subtotal += item.price * item.quantity;
        const itemElement = document.createElement('article');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `<div><h3>${item.name}</h3><span class="cart-item-price">${currency.format(item.price)} cada</span><div class="quantity-controls"><button type="button" data-cart-action="decrease" data-cart-id="${id}" aria-label="Diminuir quantidade de ${item.name}">−</button><span>${item.quantity}</span><button type="button" data-cart-action="increase" data-cart-id="${id}" aria-label="Aumentar quantidade de ${item.name}">+</button></div><button class="remove-item" type="button" data-cart-action="remove" data-cart-id="${id}">Remover</button></div><strong class="cart-item-total">${currency.format(item.price * item.quantity)}</strong>`;
        cartItems.append(itemElement);
    });

    cartCount.textContent = itemCount;
    cartSubtotal.textContent = currency.format(subtotal);
    cartEmpty.hidden = cart.size > 0;
    if (whatsappOrder) {
        const hasItems = cart.size > 0;
        whatsappOrder.classList.toggle('is-disabled', !hasItems);
        whatsappOrder.setAttribute('aria-disabled', String(!hasItems));
        whatsappOrder.href = hasItems ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}` : '#';
    }
};

const setCartOpen = (isOpen) => {
    cartPanel.classList.toggle('is-open', isOpen);
    cartPanel.setAttribute('aria-hidden', String(!isOpen));
    cartToggle.setAttribute('aria-expanded', String(isOpen));
    orderToggle?.setAttribute('aria-expanded', String(isOpen));
    cartBackdrop.hidden = !isOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
};

document.querySelectorAll('.product-add').forEach((button) => {
    button.addEventListener('click', () => {
        const id = button.dataset.product;
        const currentItem = cart.get(id);
        cart.set(id, { name: id, price: Number(button.dataset.price), quantity: currentItem ? currentItem.quantity + 1 : 1 });
        saveCart();
        renderCart();
        setCartOpen(true);
    });
});

cartToggle?.addEventListener('click', () => setCartOpen(!cartPanel.classList.contains('is-open')));
orderToggle?.addEventListener('click', () => setCartOpen(true));
document.querySelectorAll('[data-cart-close]').forEach((element) => element.addEventListener('click', () => setCartOpen(false)));
whatsappOrder?.addEventListener('click', () => {
    cart.clear();
    localStorage.removeItem(cartStorageKey);
    setTimeout(renderCart, 0);
});

cartItems?.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-cart-action]');
    if (!actionButton) return;
    const id = actionButton.dataset.cartId;
    const item = cart.get(id);
    if (!item) return;
    if (actionButton.dataset.cartAction === 'remove' || (actionButton.dataset.cartAction === 'decrease' && item.quantity === 1)) cart.delete(id);
    if (actionButton.dataset.cartAction === 'increase') item.quantity += 1;
    if (actionButton.dataset.cartAction === 'decrease' && item.quantity > 1) item.quantity -= 1;
    saveCart();
    renderCart();
});

loadCart();
renderCart();
