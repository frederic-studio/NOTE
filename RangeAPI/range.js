// Helper to schedule a DOM update via requestAnimationFrame
function runDOMUpdate(callback) {
  if (window.requestAnimationFrame) {
    requestAnimationFrame(callback);
  } else {
    setTimeout(callback, 16); // fallback ~60fps
  }
}

// Debounce helper to batch rapid events (e.g. on input)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Enhanced setCaretPosition using requestAnimationFrame
function setCaretPosition(node, method, position) {
  runDOMUpdate(() => {
    try {
      if (!node) throw new Error("Node does not exist");
      let range = document.createRange();
      let sel = window.getSelection();
      
      // Ensure node is not empty
      if (!node.textContent.trim()) {
        node.textContent = "\u200b";
      }
      
      if (['setStart', 'setEnd'].includes(method)) {
        range[method](node, position);
      } else {
        range[method](node);
      }
      
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (error) {
      console.error("Error setting caret position:", error);
    }
  });
}

// Enhanced getCaretPosition (read-only, so no scheduling needed)
function getCaretPosition() {
  const sel = window.getSelection();
  if (sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      return { container: range.startContainer, offset: range.startOffset };
    }
    return {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset,
    };
  }
  return null;
}

// Enhanced wrap function with requestAnimationFrame
function wrap(tag, element, start, end) {
  runDOMUpdate(() => {
    let range;
    
    // If element is a DOM node, wrap its contents
    if (element && element.nodeType) {
      if (!element.textContent.trim()) element.textContent = "\u200b";
      range = document.createRange();
      range.selectNodeContents(element);
    }
    // Else, if two numbers are provided, use them as start and end offsets in a container
    else if (typeof start === "number" && typeof end === "number") {
      
      if (!element) return console.error("Editor container not found.");
      if (!element.firstChild) element.textContent = "\u200b";

      range = document.createRange();
      // Note: In a production app you might need a more robust offset-to-node conversion.
      range.setStart(element.firstChild, start);
      range.setEnd(element.firstChild, end);
    } else {
      console.error("Invalid parameter for wrap. Provide a node or two numeric offsets.");
      return;
    }
    
    const wrapper = document.createElement(tag);
    try {
      range.surroundContents(wrapper);
    } catch (error) {
      console.error("Error during surroundContents, falling back to manual extraction:", error);
      const content = range.extractContents();
      wrapper.appendChild(content);
      range.insertNode(wrapper);
    }
  });
}

// Enhanced unwrap function with requestAnimationFrame
function unwrap(element, replacementTag) {
  runDOMUpdate(() => {
    if (!element || !element.parentNode) {
      console.error("Element not found or has no parent.");
      return;
    }
    
    const parent = element.parentNode;
    const range = document.createRange();
    range.selectNodeContents(element);
    const contentFragment = range.extractContents();
    
    if (replacementTag) {
      const newEl = document.createElement(replacementTag);
      newEl.appendChild(contentFragment);
      parent.replaceChild(newEl, element);
    } else {
      parent.replaceChild(contentFragment, element);
    }
  });
}



// Main logic for handling Markdown header syntax on keydown.
const editor = document.getElementById('editor');

editor.addEventListener('keyup', (e) => {
  if (e.key === '#' || e.key === ' ') heading()
});

function heading() {
  let text = getCaretPosition().container.textContent.slice(0, getCaretPosition().offset);
  let regex = /^#{1,6}\s*$/;
  console.log(text);

  if (text.match(regex)) {
    let level = text.match(/#/g).length;
    if (getCaretPosition().container.parentNode?.classList.contains('md-syntax')) {}
    let cool = wrap(`span`, getCaretPosition().container, 0, getCaretPosition().offset);
    console.log(cool);

    unwrap(getCaretPosition().container.parentNode, `h${level}`);
  }
}