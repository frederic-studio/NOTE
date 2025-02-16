const editor = document.getElementById("editor");

editor.addEventListener("input", () => {
  const target = window.getSelection().focusNode;
  const range = document.createRange();

  if (target.parentNode.tagName === 'SPAN' && target.textContent.length > 1 && getCaretPosition().offset === target.textContent.length) insideSyntax(target, range);
});

function insideSyntax(target, range) {
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


// If inline element is empty, insert zero-width space
// If inline element is empty and zero-width space is present, remove zero-width space and previous character**
// If typed character is not a space or backspace and zero-width space is present, remove zero-width space
// If typed character is space and at the right edge of inline syntax, insert space after inline syntax.

editor.addEventListener("keydown", (event) => handleEditorKeydown(event));

function handleEditorKeydown(event) {
  const focusedNode = window.getSelection().focusNode;
  const isBackspace = event.key === 'Backspace';
  const isSpace = event.key === ' ';
  const inSpanContext = focusedNode.parentNode.closest('span');
  const hasZeroWidthSpace = focusedNode.textContent.includes('\u200b');

  if (inSpanContext && focusedNode.parentNode.tagName !== 'SPAN' && focusedNode.textContent.length === 1 && isBackspace && !hasZeroWidthSpace) {
    event.preventDefault();
    focusedNode.textContent = '\u200b';
    setCaretPosition(focusedNode, 'setStart', 1);
  } else if (inSpanContext && focusedNode.parentNode.tagName !== 'SPAN' && focusedNode.textContent.length === 1 && isBackspace && hasZeroWidthSpace) {
    event.preventDefault();
    setCaretPosition(focusedNode.parentNode.parentNode.previousSibling, 'setStart', focusedNode.parentNode.parentNode.previousSibling.textContent.length);
  }

  if (!isBackspace && !isSpace && hasZeroWidthSpace) focusedNode.textContent = focusedNode.textContent.replace('\u200b', '');
  if (isSpace && inSpanContext && focusedNode.parentNode?.nextSibling?.parentNode?.tagName !== 'SPAN' && getCaretPosition().offset === focusedNode.textContent.length) {
    event.preventDefault();
    focusedNode.parentNode.after(document.createTextNode(' '));
    setCaretPosition(focusedNode.parentNode.nextSibling.nextSibling, 'setStart', 0); 
  }
};



// Add active class to the current focused node on every selection change
// If the next character is a span element, add active class to the span element
// Remove previous "active" classes
// If the commonAncestorContainer is not an element (for example, it's a text node),
// use its parent element so we can add a class.
// Create a TreeWalker that visits element nodes that are (at least partly) within the selection
// Add "active" to the root node if it is within the selection
// Walk through all qualifying descendant nodes and add "active"

document.addEventListener("selectionchange", () => {
  document.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  const commonAncestor =
    range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer
      : range.commonAncestorContainer.parentElement;

  const walker = document.createTreeWalker(
    commonAncestor,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) =>
        selection.containsNode(node, true)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP,
    },
    false
  );
  let node;
  if (selection.containsNode(commonAncestor, true)) commonAncestor.classList.add("active");
  while ((node = walker.nextNode())) node.classList.add("active");
  
});





// Helper functions
// Set caret position
// node: node type 3
// method: setStart, setEnd, setStartBefore, setEndBefore, setStartAfter, setEndAfter
// position: offset value
// Get caret position
// Return object with startContainer, startOffset, endContainer, endOffset

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


