const glyphs = {};
const glyphNames = [];
const SLOTS_COUNT = 15;
const slots = [];
const startingGlyphs = [];
const scrambleInterval = 50;
const initialScramble = 600;
const touchStopInterval = 600;
let scrambleTimerId = null;
const slotHoverTimers = {};
const slotTouchTimers = {};

function init() {

    // Get all the glyphs
    const svgEl = document.getElementById("animation");
    const glyphEls = svgEl.querySelectorAll("symbol");
    glyphEls.forEach(glyphEl => {
        const glyph = parseGlyph(glyphEl);
        if (glyph) {
            glyphs[glyph.id] = glyph;
            glyphNames.push(glyph.id);
        }
    });

    // Fetch all the slots
    for (let i = 1; i <= SLOTS_COUNT; i++) {
        const slot = parseSlot(`slot-${i}`);
        if (slot) {
            slots.push(slot);
        }
    }

    // Get the starting glyphs for each slot
    slots.forEach(slot => {
        startingGlyphs.push(slot.glyph);
    });

    // Automatically run scramble animation for initialScramble, then reset
    scramble();
    scrambleTimerId = window.setInterval(() => {
        scramble();
    }, scrambleInterval);

    // Stop after initialScramble and reset
    setTimeout(() => {
        if (scrambleTimerId !== null) {
            window.clearInterval(scrambleTimerId);
            scrambleTimerId = null;
        }
        resetScramble();
        setupSlotHoverHandlers();
    }, initialScramble);
}

function parseGlyph(elem) {
    const g = {};
    const id = elem.id.split("-")[1];
    g.id = id;

    const viewBox = elem.getAttribute("viewBox");
    const [x, y, width, height] = viewBox.split(" ");
    g.x = parseFloat(x);
    g.y = parseFloat(y);
    g.width = parseFloat(width);
    g.height = parseFloat(height);

    return g;
}

function parseSlot(id) {
    let s = { id: id }
    let slot = document.getElementById(id);
    if (!slot) {
        console.error(`Slot ${id} not found`);
        return null;
    }
    s.element = slot;
    const transform = slot.getAttribute("transform");
    if (!transform) {
        console.error(`Transform not found for slot ${id}`);
        return null;
    }
    const match = transform.match(/translate\(([-\d.]+)\s+([-\d.]+)\)/);
    if (!match) {
        console.error(`Transform ${transform} not found`);
        return null;
    }
    s.tx = parseFloat(match[1]);
    s.ty = parseFloat(match[2]);

    const useEl = slot.querySelector("use");
    if (!useEl) {
        console.error('No <use> child found inside #slot-14');
        return null;
    }
    s.useEl = useEl;

    const useHref = useEl.getAttribute("href");
    const useWidthAttr = useEl.getAttribute("width");
    const useHeightAttr = useEl.getAttribute("height");

    if (!useHref || !useWidthAttr || !useHeightAttr) {
        console.error('Href or width or height attribute not found');
        return null;
    }

    s.glyph = useHref.split("-")[1];
    s.width = parseFloat(useWidthAttr);
    s.height = parseFloat(useHeightAttr);

    return s;
}

function scramble() {
    for (let i = 0; i < SLOTS_COUNT; i++) {
        const glyphName = glyphNames[Math.floor(Math.random() * glyphNames.length)];
        placeGlyph(i, glyphName, true);
    }
}

function resetScramble() {
    startingGlyphs.forEach((glyph, index) => {
        placeGlyph(index, glyph, false);
    });
}

function scrambleSlot(slotIndex) {
    const glyphName = glyphNames[Math.floor(Math.random() * glyphNames.length)];
    placeGlyph(slotIndex, glyphName, true);
}

function resetSlot(slotIndex) {
    placeGlyph(slotIndex, startingGlyphs[slotIndex], false);
}

function stopSlotAnimation(slotIndex) {
    // Clear the timer to stop scrambling
    if (slotHoverTimers[slotIndex]) {
        window.clearInterval(slotHoverTimers[slotIndex]);
        slotHoverTimers[slotIndex] = null;
    }
    // Clear touch timer if it exists
    if (slotTouchTimers[slotIndex]) {
        window.clearTimeout(slotTouchTimers[slotIndex]);
        slotTouchTimers[slotIndex] = null;
    }
    // Reset to original glyph
    resetSlot(slotIndex);
}

function setupSlotHoverHandlers() {
    const svgEl = document.getElementById("animation");
    let currentActiveSlot = null;

    // Use mousemove to track which slot we're over
    svgEl.addEventListener('mousemove', (e) => {
        // Get mouse position in screen coordinates
        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Check which slot contains this point using getBoundingClientRect
        let slotIndex = -1;
        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const rect = slot.element.getBoundingClientRect();

            // Check if mouse is within the slot's bounding rectangle
            if (mouseX >= rect.left && mouseX <= rect.right &&
                mouseY >= rect.top && mouseY <= rect.bottom) {
                slotIndex = i;
                break;
            }
        }

        if (slotIndex >= 0 && slotIndex < slots.length) {
            // Mouse is over a slot
            if (currentActiveSlot !== slotIndex) {
                // Stop previous slot if any
                if (currentActiveSlot !== null) {
                    stopSlotAnimation(currentActiveSlot);
                }

                currentActiveSlot = slotIndex;

                // Clear any existing timer for this slot
                if (slotHoverTimers[slotIndex]) {
                    window.clearInterval(slotHoverTimers[slotIndex]);
                }
                // Start scrambling immediately
                scrambleSlot(slotIndex);
                // Continue scrambling at scrambleInterval
                slotHoverTimers[slotIndex] = window.setInterval(() => {
                    scrambleSlot(slotIndex);
                }, scrambleInterval);
            }
        } else {
            // Mouse is not over any slot
            if (currentActiveSlot !== null) {
                stopSlotAnimation(currentActiveSlot);
                currentActiveSlot = null;
            }
        }
    });

    // Also check when mouse leaves the SVG entirely
    svgEl.addEventListener('mouseleave', () => {
        if (currentActiveSlot !== null) {
            stopSlotAnimation(currentActiveSlot);
            currentActiveSlot = null;
        }
    });

    // Cancel animations when mouse leaves the page/window
    document.addEventListener('mouseleave', () => {
        if (currentActiveSlot !== null) {
            stopSlotAnimation(currentActiveSlot);
            currentActiveSlot = null;
        }
    });

    // Also handle mouseout on document to catch when leaving the window
    document.addEventListener('mouseout', (e) => {
        // Check if mouse is leaving the document (not just moving between elements)
        if (!e.relatedTarget && !e.toElement) {
            if (currentActiveSlot !== null) {
                stopSlotAnimation(currentActiveSlot);
                currentActiveSlot = null;
            }
        }
    });

    // Handle when window loses focus (e.g., user switches tabs)
    window.addEventListener('blur', () => {
        if (currentActiveSlot !== null) {
            stopSlotAnimation(currentActiveSlot);
            currentActiveSlot = null;
        }
    });

    // Touch event handlers for mobile
    let currentTouchSlot = null;

    function getSlotFromTouch(touch) {
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        for (let i = 0; i < slots.length; i++) {
            const slot = slots[i];
            const rect = slot.element.getBoundingClientRect();

            if (touchX >= rect.left && touchX <= rect.right &&
                touchY >= rect.top && touchY <= rect.bottom) {
                return i;
            }
        }
        return -1;
    }

    svgEl.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent default touch behavior
        const touch = e.touches[0];
        const slotIndex = getSlotFromTouch(touch);

        if (slotIndex >= 0 && slotIndex < slots.length) {
            // Stop any previous touch animation
            if (currentTouchSlot !== null && currentTouchSlot !== slotIndex) {
                stopSlotAnimation(currentTouchSlot);
            }

            currentTouchSlot = slotIndex;

            // Clear any existing timers for this slot
            if (slotHoverTimers[slotIndex]) {
                window.clearInterval(slotHoverTimers[slotIndex]);
                slotHoverTimers[slotIndex] = null;
            }
            if (slotTouchTimers[slotIndex]) {
                window.clearTimeout(slotTouchTimers[slotIndex]);
                slotTouchTimers[slotIndex] = null;
            }

            // Start scrambling immediately
            scrambleSlot(slotIndex);
            // Continue scrambling at scrambleInterval
            slotHoverTimers[slotIndex] = window.setInterval(() => {
                scrambleSlot(slotIndex);
            }, scrambleInterval);

            // Set timer to stop after touchStopInterval
            slotTouchTimers[slotIndex] = window.setTimeout(() => {
                stopSlotAnimation(slotIndex);
                currentTouchSlot = null;
            }, touchStopInterval);
        }
    });

    svgEl.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (currentTouchSlot !== null) {
            stopSlotAnimation(currentTouchSlot);
            currentTouchSlot = null;
        }
    });

    svgEl.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        if (currentTouchSlot !== null) {
            stopSlotAnimation(currentTouchSlot);
            currentTouchSlot = null;
        }
    });

    svgEl.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const slotIndex = getSlotFromTouch(touch);

        // If touch moved to a different slot or off all slots
        if (slotIndex !== currentTouchSlot) {
            if (currentTouchSlot !== null) {
                stopSlotAnimation(currentTouchSlot);
            }
            currentTouchSlot = null;

            // If moved to a new valid slot, start animation there
            if (slotIndex >= 0 && slotIndex < slots.length) {
                currentTouchSlot = slotIndex;

                // Clear any existing timers
                if (slotHoverTimers[slotIndex]) {
                    window.clearInterval(slotHoverTimers[slotIndex]);
                    slotHoverTimers[slotIndex] = null;
                }
                if (slotTouchTimers[slotIndex]) {
                    window.clearTimeout(slotTouchTimers[slotIndex]);
                    slotTouchTimers[slotIndex] = null;
                }

                // Start scrambling
                scrambleSlot(slotIndex);
                slotHoverTimers[slotIndex] = window.setInterval(() => {
                    scrambleSlot(slotIndex);
                }, scrambleInterval);

                // Set timer to stop after touchStopInterval
                slotTouchTimers[slotIndex] = window.setTimeout(() => {
                    stopSlotAnimation(slotIndex);
                    currentTouchSlot = null;
                }, touchStopInterval);
            }
        }
    });
}

function placeGlyph(slotIndex, glyphName, scale) {
    const glyph = glyphs[glyphName];
    const slot = slots[slotIndex];
    slot.useEl.setAttribute("href", `#g-${glyphName}`);

    if (scale) {
        let adjGlyphWidth = glyph.width * (slot.height / glyph.height);
        let scaleX = slot.width > adjGlyphWidth ? adjGlyphWidth / slot.width : 1;
        let posX = slot.width > adjGlyphWidth ? (slot.width - adjGlyphWidth) / 2 : 0;
        slot.element.setAttribute("transform", `translate(${slot.tx + posX} ${slot.ty}) scale(${scaleX} 1)`);

    } else {
        slot.element.setAttribute("transform", `translate(${slot.tx} ${slot.ty})`);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    init();
});
