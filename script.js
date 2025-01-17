const noteContainer = document.getElementById('note-container');
let currentActiveNode = null; // Cache the active node
let spacePressCount = 0; // Counter for space presses
let spacePressTimeout;   // Timeout to reset the counter
const markdownTags = {
    inline: {
        "**": "strong",       // Bold
        "__": "strong",       // Bold
        "*": "em",            // Italic
        "_": "em",            // Italic
        "~~": "del",          // Strikethrough
        "`": "code",          // Inline code
        "[text](url)": "a",   // Link
        "![alt](url)": "img", // Image
    },
    block: {
        "#": "h1",            // Heading 1
        "##": "h2",           // Heading 2
        "###": "h3",          // Heading 3
        "####": "h4",         // Heading 4
        "#####": "h5",        // Heading 5
        "######": "h6",       // Heading 6
        ">": "blockquote",    // Blockquote
        "```": "pre",         // Code block
        "---": "hr",          // Horizontal rule
    },
    list: {
        "-": "ul",            // Unordered list
        "*": "ul",            // Unordered list
        "1.": "ol",           // Ordered list
        "-[]": "task",          // Task list
    }
};

noteContainer.addEventListener('keydown', (e) => {
    let target = findNode();
    if (e.code === 'Space') convertMdToHTML(e, target);
    if (e.code === 'Enter') addBlock(e, target);
    if (e.code === 'Backspace') handleBackspace(e, target);
    if (e.code === 'Semicolon') addInline(e, target);
});

function active() {
    newActiveNode = findNode() || noteContainer.querySelector('.active');

    if (newActiveNode !== currentActiveNode) {
        if (currentActiveNode) currentActiveNode.classList.remove('active');
        newActiveNode.classList.add('active');
        currentActiveNode = newActiveNode;
    }
}

['keyup', 'click', 'blur'].forEach(event => {
    noteContainer.addEventListener(event, () => active());
});

function handleDoubleSpace(e, targetNode) {
    if (!targetNode.closest('.md-inline')) return;
    spacePressCount++;
    clearTimeout(spacePressTimeout);
    spacePressTimeout = setTimeout(() => {
        spacePressCount = 0;
    }, 300);

    if (spacePressCount === 2) {
        spacePressCount = 0; // Reset the counter
        num = targetNode.textContent.length;
        targetNode.textContent = targetNode.textContent.slice(0, num - 1);
        caretPosition(targetNode.closest('#note-container > *'), 'set', 'end');
    }
}

function addInline(e, targetNode) {
    if (targetNode.classList.contains('md-block')) return;

    let caretPos = caretPosition(targetNode, 'get');
    let textBefore = targetNode.textContent.slice(0, caretPos).trim();
    let lastWord = textBefore.split(' ').pop();

    // Remove the last word from the content
    let updatedText = textBefore.slice(0, -lastWord.length).trim(); // Remove the last word
    let remainingText = targetNode.textContent.slice(caretPos); // Keep the text after caret

    e.preventDefault();

    // Update the target node with the new structure
    targetNode.innerHTML = `${updatedText} <span class="md-inline">${lastWord}:<${lastWord}>\u200B</${lastWord}>;</span>${remainingText}`;
    
    // Move the caret inside the newly added code element
    let code = targetNode.querySelector(`${lastWord}`);
    caretPosition(code, 'set', 1);
}


function convertMdToHTML(e, targetNode) {
    handleDoubleSpace(e, targetNode);
    let target = targetNode.classList.contains('md-block') ? targetNode.parentNode : targetNode;
    let textBefore = targetNode.textContent.slice(0, caretPosition(targetNode, 'get')).trim();
    textBefore = textBefore.replace('\u200B', '');  // Zero-width space
    let textAfter = target.textContent.replace(textBefore, '').trim();

    if (targetNode.parentNode.classList.contains('md-inline')) {
        let space;
        if (space === 1) {
            caretPosition(targetNode.closest('#note-container > *'), 'set', 'end');
            space = 0;
            console.log('space 1')
        } else {space = 1; console.log(space)};
    }

    if (markdownTags["block"][textBefore]) {
        e.preventDefault();
        const tag = markdownTags["block"][textBefore];

        const fragment = document.createDocumentFragment();
        const element = document.createElement(tag);
        const MDBlock = document.createElement('span');

        MDBlock.classList.add('md-block');
        MDBlock.textContent = textBefore;
        element.textContent = textAfter.startsWith('\u200B') ? textAfter : '\u200B' + textAfter;  // Zero-width space

        fragment.appendChild(element);
        target.replaceWith(fragment);

        caretPosition(element, 'set', 1);
        element.insertBefore(MDBlock, element.firstChild);
    }
}


function addBlock(e, target) {
    if (target.classList.contains('md-block')) {
        e.preventDefault();
        return;
    }

    const paragraph = document.createElement('p');
    paragraph.textContent = '\u200B'; // Start with zero-width space
    target.insertAdjacentElement('afterend', paragraph);

    caretPosition(paragraph, 'set', 'start');
    e.preventDefault();
}

function handleBackspace(e, target) {
    if (target.classList.contains('md-block')) {
        e.preventDefault();
        const parent = target.parentNode;
        target.remove();
        caretPosition(parent, 'set', 1);
    } else if (target === noteContainer.firstElementChild && !target.textContent.trim()) {
        e.preventDefault();
    }
}

function findNode() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return noteContainer.lastElementChild;
    const node = selection.anchorNode;
    
    if (node && node.nodeType === Node.TEXT_NODE) return node.parentNode;
    if (node) return node;
    return noteContainer.lastElementChild;
}


function caretPosition(element, action = 'get', position = 0) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0;
    const range = selection.getRangeAt(0);

    if (action === 'get') {
        const tempRange = range.cloneRange();
        tempRange.selectNodeContents(element);
        tempRange.setEnd(range.endContainer, range.endOffset);
        return tempRange.toString().length;
    } else if (action === 'set') {
        let textNode = element.firstChild;

        if (!textNode) {
            element.textContent = '';
            textNode = element.firstChild;
        }

        if (position === 'start') {
            range.setStart(textNode, 0);
        } else if (position === 'end') {
            range.selectNodeContents(element);
            range.collapse(false);
        } else {
            range.setStart(textNode || element, Math.min(position, (textNode?.textContent || "").length));
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
