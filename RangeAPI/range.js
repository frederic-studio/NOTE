const editor = document.getElementById('editor');
let selection;

document.addEventListener('selectionchange', () => selection = window.getSelection());

editor.addEventListener('input', (e) => {
  heading();
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBlock(e);
});

function addBlock(e) {
  e.preventDefault();
  let caretPosition = selection.anchorOffset;
  let node = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentNode : selection.anchorNode;
  let paragraph = document.createElement('P');

  if (node.classList.contains('block')) return;
  node.insertAdjacentElement('afterend', paragraph);
  paragraph.textContent = selection.anchorNode.textContent.slice(caretPosition).length > 0 ? selection.anchorNode.textContent.slice(caretPosition) : '\u200B';
  node.textContent = node.textContent.slice(0, caretPosition);
  setCaretPosition(paragraph, 0);
}

function heading() {
  let caretPosition = selection.anchorOffset;
  let text = selection.anchorNode.textContent.slice(0, caretPosition);
  let node = selection.anchorNode.nodeType === Node.TEXT_NODE ? selection.anchorNode.parentNode : selection.anchorNode;
  let previousNode = node?.previousSibling;

  if (previousNode?.classList?.contains('block')) return;
  if (!text.match(/^#{1,6}\s/)) return;
  if (!editor.contains(node)) return;
  
  if (!node.classList.contains('block')) {
    surroundContentByIndices(0, caretPosition - 1, selection.anchorNode, 'span');
    wrapComplexNode(node, `H${text.length - 1}`);
  } else if (node.textContent.length > caretPosition) {
    node.textContent = node.textContent.slice(0, caretPosition);
    wrapComplexNode(node.parentNode, `H${node.textContent.length - 1}`);
    setCaretPosition(node.nextSibling, 1, document.createTextNode(node.textContent.slice(caretPosition)));
    node.textContent = node.textContent.trim();
  } else{
    wrapComplexNode(node.parentNode, `H${text.length - 1}`);
    setCaretPosition(node.nextSibling, 1);
    node.textContent = node.textContent.trim();
  }
}

// Function to surround content using start and end indices
function surroundContentByIndices(start, end, node, wrapper) {
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end);
  let tag = document.createElement(wrapper)
  if (wrapper === 'span') tag.classList.add('block');
  try {
    range.surroundContents(tag);
    range.setStart(tag.nextSibling, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (err) {
    console.error('Error surrounding content:', err);
    alert('Please make a valid selection within a single text node.');
  }
}


function wrapComplexNode(node, wrapperTag) {
  const selection = window.getSelection();
  const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  let caretOffset = null;
  if (range && node.contains(range.startContainer)) caretOffset = getCaretCharacterOffsetWithin(node);
  
  const wrapper = document.createElement(wrapperTag);
  while (node.firstChild) wrapper.appendChild(node.firstChild);
  node.replaceWith(wrapper);
  
  if (caretOffset !== null) setCaretPosition(wrapper, caretOffset);
}

function getCaretCharacterOffsetWithin(element) {
  const selection = window.getSelection();
  let caretOffset = 0;

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
}

// Helper function to set caret position within an element at a specific character offset
function setCaretPosition(element, offset, insertNode) {
  const range = document.createRange();
  const selection = window.getSelection();

  let charIndex = 0;
  const nodeStack = [element];
  let node, found = false;

  while (!found && (node = nodeStack.pop())) {
    if (node.nodeType === Node.TEXT_NODE) {
      const nextCharIndex = charIndex + node.length;
      if (offset >= charIndex && offset <= nextCharIndex) {
        range.setStart(node, offset - charIndex);
        range.collapse(true);
        found = true;
      }
      charIndex = nextCharIndex;
    } else {
      let i = node.childNodes.length;
      while (i--) {
        nodeStack.push(node.childNodes[i]);
      }
    }
  }
  
  if (found) {
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    // Place caret at the end if the position wasn't found
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
