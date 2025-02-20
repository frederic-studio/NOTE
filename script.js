const editor = document.getElementById("editor");
const inlineSyntax = ["*", "_", "~", "`"];

editor.addEventListener("input", () => {
  const target = window.getSelection().focusNode;
  const range = document.createRange();

  if (target.parentNode.tagName === 'SPAN' && target.textContent.length > 1 && getCaretPosition().offset === target.textContent.length) insideSyntax(target, range);
  editor.normalize();
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
// If inline element is empty and zero-width space is present, remove all md-syntax and zero-width space
// If space on right syntax, insert proper space after inline syntax
// If syntax is deleted, make it regular text

editor.addEventListener("keydown", (event) => handleEditorKeydown(event));

function handleEditorKeydown(event) {
  const focusedNode = window.getSelection().focusNode;
  const isBackspace = event.key === 'Backspace';
  const isSpace = event.key === ' ';
  const inSpanContext = focusedNode.parentNode.closest('span');
  const isRightSyntax = focusedNode.previousSibling && focusedNode.parentNode.tagName === 'SPAN';
  const isLeftSyntax = focusedNode.nextSibling && focusedNode.parentNode.tagName === 'SPAN';
  const hasZeroWidthSpace = focusedNode.textContent.includes('\u200b');
  let position = null;
  let target = null;

    if (inSpanContext && focusedNode.parentNode.tagName !== 'SPAN' && focusedNode.textContent.length === 1 && isBackspace) {
      event.preventDefault();
      if (!hasZeroWidthSpace) {
        focusedNode.textContent = '\u200b';
        setCaretPosition(focusedNode, 'setStart', 1);
      } else if (hasZeroWidthSpace) {
        target = focusedNode.parentNode.parentNode.previousSibling;
        position = focusedNode.parentNode.parentNode.previousSibling.textContent.length;
        setCaretPosition(target, 'setStart', position);
        focusedNode.parentNode.parentNode.remove();
        editor.normalize();
      }
      return;
  }

  if (isSpace && isRightSyntax && getCaretPosition().offset === focusedNode.textContent.length) {
    event.preventDefault();
    focusedNode.parentNode.after(document.createTextNode(' '));
    editor.normalize();
    setCaretPosition(focusedNode.parentNode.nextSibling, 'setStart', 1);
    return;
  }

  if (isBackspace && (isLeftSyntax || isRightSyntax)) {
    event.preventDefault();
    focusedNode.textContent = ''
    let span = focusedNode.parentNode.closest('span');
    let text = span.textContent
    span.before(document.createTextNode(text));
    if (isRightSyntax) setCaretPosition(span.nextSibling, 'setStart', 0);
    if (isLeftSyntax) setCaretPosition(span.previousSibling, 'setStart', 0);
    span.remove();
    editor.normalize();
    return;
  }

  if (inlineSyntax.includes(event.key)) {
    let block = focusedNode.parentNode.closest('#editor > *');
    let text = extractContents(block);
    if (text.search(event.key) !== -1) {
      console.log('Syntax already exists');
      text.search(event.key) < getCaretPosition().offset ? first = text.search(event.key) : first = getCaretPosition().offset;
      text.search(event.key) > getCaretPosition().offset ? last = text.search(event.key) : last = getCaretPosition().offset;
      console.log(first, last);
      setRange(block, first, last).surroundContents(document.createElement('em'));
    
    }
  }
};

function extractContents(content) {
  let text = '';
  content.childNodes.forEach(node => {
    if (node.nodeType === 3) text += node.textContent; 
  });
  return text;
}

function setRange(container, start, end) {
  let range = document.createRange();
  let accumulatedLength = 0;
  let startSet = false;

  for (let i = 0; i < container.childNodes.length; i++) {
    let child = container.childNodes[i];
    let childLength = child.textContent.length;

    // If the start position lies within this child node, set the start of the range.
    if (!startSet && accumulatedLength + childLength >= start) {
      let offset = start - accumulatedLength;
      range.setStart(child, offset);
      startSet = true;
    }
    
    // If the end position lies within this child node, set the end of the range.
    if (accumulatedLength + childLength >= end) {
      let offset = end - accumulatedLength;
      range.setEnd(child, offset);
      break;
    }
    
    accumulatedLength += childLength;
  }

  return range;
}


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
  if (selection.focusNode?.nextSibling?.tagName === 'SPAN' && getCaretPosition().offset === selection.focusNode.textContent.length) selection.focusNode.nextSibling.classList.add("active");
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
      editor.normalize();
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


