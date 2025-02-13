const editor = document.getElementById("editor");

editor.addEventListener("input", (e) => {
  const target = window.getSelection().focusNode;
  const range = document.createRange();


  if (target.parentNode.tagName === 'SPAN' && target.textContent.length > 1 && getCaretPosition().offset === target.textContent.length) {
    range.setStart(target, target.length - 1); // From the start
    range.setEnd(target, target.length); // To the second character
    const extractedContent = range.extractContents();
    if (!target.nextSibling) {
        target.parentNode.after(extractedContent);
        setCaretPosition(target.parentNode.nextSibling, 'setStart', 1);
    } else {
        target.nextSibling.childNodes[0].before(extractedContent);
        setCaretPosition(target.nextSibling.childNodes[0], 'setStart', 1);
    }
  }
});

editor.addEventListener("keydown", (e) => {
  const target = window.getSelection().focusNode;
  const range = document.createRange();

  if (target.parentNode.closest('span') && target.parentNode.tagName !== 'SPAN' && target.textContent.length === 1 && e.key === 'Backspace' && !target.textContent.startsWith('\u200b')) {
    e.preventDefault();
    target.textContent = '\u200b';
    setCaretPosition(target, 'setStart', 1);
  };

});

document.addEventListener("selectionchange", (e) => active(window.getSelection().focusNode));

function active(target) {
  console.log(target, target.parentNode);
  document.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));
  target.parentNode.classList.add("active");
}

editor.addEventListener("keyup", (e) => {
  const target = window.getSelection().focusNode;
  const range = document.createRange();
  console.log(target.textContent.startsWith('\u200b'))
  console.log(target)
  console.log(getCaretPosition())

});

function setCaretPosition(node, method, position) {
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

function inlineGestion(target) {
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  if (target.parentNode.tagName === 'SPAN') {
    console.log('is span')
    if (!target.nextSibling) {
      const range = document.createRange();
      range.setStart(target, 0);
    }
  } else {
    console.log('is inside span')
  }
}
