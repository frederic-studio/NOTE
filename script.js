const noteContainer = document.getElementById('note-container');
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
        "-": "li",            // Unordered list item
        "*": "li",            // Unordered list item
        "1.": "li",           // Ordered list item
        ">": "blockquote",    // Blockquote
        "```": "pre",         // Code block
        "---": "hr",          // Horizontal rule
        "\n\n": "p",          // Paragraph
    },
    list: {
        "-": "ul",            // Unordered list
        "*": "ul",            // Unordered list
        "1.": "ol",           // Ordered list
        "-[]": "task",          // Task list
    }
};

noteContainer.addEventListener('keyup', () => active());
noteContainer.addEventListener('click', () => active());

noteContainer.addEventListener('keydown', (e) => {
    if (e.code === 'Space') convertMdToHTML(e);
    if (e.code === 'Enter') addBlock(e);
    if (e.code === 'Backspace') handleBackspace(e);
});

function active() {
    let target = findNode().closest('#note-container > *') || noteContainer.querySelector('.active');
    noteContainer.querySelectorAll('.active').forEach(node => node.classList.remove('active'));
    target.classList?.add('active');
}

function convertMdToHTML(e) {
    let target = findNode().classList.contains('md-block') ? findNode().parentNode : findNode();
    let textBefore = findNode().textContent.slice(0, caretPosition(findNode(), 'get')).trim();
    textBefore = textBefore.replace('\u200B', '');  // Zero-width space
    let textAfter = target.textContent.replace(textBefore, '').trim();

    if (markdownTags["block"][textBefore]) {
        e.preventDefault();
        const tag = markdownTags["block"][textBefore];

        const fragment = document.createDocumentFragment();
        const element = document.createElement(tag);
        const MDBlock = document.createElement('span');

        MDBlock.classList.add('md-block');
        MDBlock.textContent = textBefore;
        element.textContent = textAfter.startsWith(' ') ? textAfter : ' ' + textAfter;  // Zero-width space

        fragment.appendChild(element);
        target.replaceWith(fragment);

        caretPosition(element, 'set', 1);
        element.insertBefore(MDBlock, element.firstChild);
    }
}


function addBlock(e) {
    if (findNode().classList.contains('md-block')) return e.preventDefault();
    const paragraph = document.createElement('p');
    findNode().insertAdjacentElement('afterend', paragraph);
    paragraph.textContent = '\u200B';  // Zero-width space
    caretPosition(paragraph, 'set', 1);
    e.preventDefault();
    active();
}

function handleBackspace(e) {
    if (findNode().classList.contains('md-block')) return removeSyntax(e);
    if (findNode() === noteContainer.firstElementChild && !findNode().textContent) return  e.preventDefault();;
}

function removeSyntax(e) {
    let target = findNode().parentNode;

    if (findNode().textContent.length === 1) {
        e.preventDefault();
        caretPosition(target, 'set', '1');
        target.firstChild.remove();
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
