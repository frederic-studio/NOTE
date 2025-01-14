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
    }
};

noteContainer.addEventListener('keydown', (e) => {
    if (e.code === 'Space') convertMdToHTML(e);
});

function convertMdToHTML(e) {
    const target = findNode();
    if (!target) return;
    let text = target.textContent.trim();
    if (markdownTags["block"][text]) {
        e.preventDefault();
        const tag = markdownTags["block"][text];
        const element = document.createElement(tag);
        const span = document.createElement('span');
        span.textContent = text;

        target.replaceWith(element);
        element.appendChild(span);

        // Add a zero-width space to ensure the caret is placeable
        const zeroWidthSpace = document.createTextNode('\u200B');
        element.appendChild(zeroWidthSpace);

        // Set caret position after the zero-width space
        caretPosition(element, 'set', 'end');
    }
}


function findNode() {
    const selection = window.getSelection();
    const node = selection.anchorNode;
    if (!selection || selection.rangeCount === 0) return null;
    return node && node.nodeType === 3 ? node.parentNode : null;
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