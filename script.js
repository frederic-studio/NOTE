const noteContainer = document.getElementById('note-container');
const commandInput = document.getElementById('command-input');
const commandPalette = document.getElementById('command-palette');
const commandPaletteContainer = document.querySelector('#command-container');
let targetNode;

const commands = {
    Text: [
        {Name: "display", Type: "h1"}, 
        {Name: "headline", Type: "h2"}, 
        {Name: "subtitle", Type: "h3"}, 
        {Name: "paragraph", Type: "p"}
    ],
    List: [
        {Name: "ordered", Type: "ol"},
        {Name: "unordered", Type: "ul"},
        {Name: "checklist", Type: "form"}
    ],
    Object: [
        {Name: "image", Type: "img"}, 
        {Name: "table", Type: "table"}, 
        {Name: "link", Type: "a"}
    ]
};

// Note container gestions
// 1. Handle keydown events
// 2. Handle backspace key
// 3. Handle adding new items based on type
// 4. Handle adding new text
// 5. Handle adding new list and list items
// 6. Handle removing nodes and empty nodes

noteContainer.addEventListener('keydown', (e) => {
    const newTargetNode = e.target.closest('[contenteditable="true"]') || (() => { return; })();
    if (targetNode && targetNode !== newTargetNode) {
        targetNode.removeAttribute('data-target');
    }
    targetNode = newTargetNode;
    if (targetNode) {
        targetNode.setAttribute('data-target', 'true');
    }
    
    if (e.key === "Backspace") {
        handleBackspace(e);
    }

    if (e.key === "Enter") {
        e.preventDefault();
        const newElement = addItems(targetNode);
        findSibling(targetNode, 'previous');
        targetNode = newElement;
    }

    if (e.key === "/") {
        e.preventDefault();
        if (!e.target.textContent) e.target.innerHTML = '';
        lastCaretPosition = caretPosition(e.target, 'get');
        commandPaletteContainer.showPopover();
        e.target.blur();
        (window.innerWidth > 600) && commandInput.focus();
    }
});

function handleBackspace(e) {
    const selection = window.getSelection();
    const caretPos = caretPosition(e.target, 'get');
    const textContent = e.target.textContent;

    if (selection.rangeCount > 0 && !selection.isCollapsed) {
        e.preventDefault();
        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const newText = textContent.slice(0, startOffset) + textContent.slice(endOffset);
        e.target.textContent = newText;
        caretPosition(e.target, 'set', startOffset);
    } else {
        if (textContent.length === 1 && caretPos === 1) {
            e.preventDefault();
            e.target.innerHTML = '';
        } else if (caretPos === 0 && !e.target.classList.contains('title-page')) {
            e.preventDefault();
            if (e.target.tagName !== 'P' && getCommandDetail(e.target.getAttribute('data-name')) !== 'List') {
                addItems(e.target, 'paragraph');
                handleRemovingNode('Empty', e.target);
                return;
            }
            handleRemovingNode(null, e.target);
        } 
    }
}

function addItems(targetNode, newType) {
    commandPaletteContainer.hidePopover();
    let itemCategory = getCommandDetail(newType || targetNode.getAttribute('data-name'), 'category');
    switch (itemCategory) {
        case 'Text': return addText(targetNode, newType);
        case 'List': return addList(targetNode, newType);
        case 'Object': return addObject(targetNode, newType);
        default: 
            console.error(`Unknown category: ${itemCategory}`);
            return null;
    }
}

function addText(targetNode, newType) {
    let newElement = document.createElement(getCommandDetail(newType, 'Type') || 'p');
    let placeholder = `Type to add a ${newType || 'paragraph'}`;
    let textAfterCaret = targetNode.textContent.substring(caretPosition(targetNode, 'get'));
    const ancestor = targetNode.closest('#note-container > *');
    (ancestor ? ancestor : targetNode).insertAdjacentElement('afterend', newElement);
    newElement.setAttribute('contenteditable', 'true');
    newElement.setAttribute('data-name', newType || 'paragraph');
    newElement.setAttribute('data-placeholder', placeholder);
    targetNode.textContent = targetNode.innerText.substring(0, caretPosition(targetNode, 'get'));
    newElement.focus();
    newElement.innerText = textAfterCaret;
    handleRemovingNode('Empty', targetNode, newType);
    return newElement;
}

function addList(targetNode, newType) {
    let newItem = newType || targetNode.getAttribute('data-name');
    let template = document.getElementById(`template-${newItem}`);
    let textAfterCaret = targetNode.textContent.substring(caretPosition(targetNode, 'get'));
    let clone = template.content.cloneNode(true);
    const ancestor = targetNode.closest('#note-container > *');
    let newElement;

    if (newType) {
        newElement = clone.firstElementChild;
        (ancestor ? ancestor : targetNode).insertAdjacentElement('afterend', newElement);
        handleRemovingNode('Empty', targetNode, newType);
    } else if (!targetNode.textContent) {
        let lastChild = ancestor.lastElementChild;
        if (!lastChild.contains(targetNode)) splitList(targetNode);
        return addItems(targetNode, 'paragraph');
    } else {
        let e = clone.firstElementChild.children[0];
        (targetNode.parentNode.closest(`[data-name='${newItem}'] > *`) || targetNode).insertAdjacentElement('afterend', e);
        newElement = e.querySelector('[contenteditable]') || e;
    }
    targetNode.innerText = targetNode.innerText.substring(0, caretPosition(targetNode, 'get'));
    newElement.hasAttribute('contenteditable') 
        ? newElement.focus() 
        : newElement.querySelector('[contenteditable]').focus();
    
    (newElement.querySelector('[contenteditable]') || newElement).innerText = textAfterCaret;
    return newElement;
}

function handleRemovingNode(action, target, newType) {
    let ancestor = target.parentNode?.closest(`[data-name='${target.getAttribute('data-name')}']`);
    let textAfterCaret = targetNode.textContent.substring(caretPosition(targetNode, 'get'));
    let newElement;

    if (action === 'Empty') {
        if (!target.textContent && !target.classList.contains('title-page') && newType) {
            ancestor ? (ancestor.contains(findSibling(target, 'previous')) 
                     ? Array.from(ancestor.children).find(child => child.contains(target))?.remove() 
                     : ancestor.remove()) 
                     : target.remove(); 
        } 
        return;
    } else {
        newElement = findSibling(target, 'previous');
        if (!ancestor) {
            if (target.previousElementSibling.getAttribute('data-name') === target.nextElementSibling?.getAttribute('data-name')) {
                let listBefore = target.previousElementSibling;
                let listAfter = target.nextElementSibling;
                while ((el = listAfter.firstElementChild), el) listBefore.appendChild(el);
                listAfter.remove();
            } 
            target.remove();
        } else {
            let currentNode = Array.from(ancestor.children).find(child => child.contains(target));
            if (ancestor.contains(findSibling(target, 'previous'))) {
                currentNode.remove();
            } else {
                newElement = addItems(target, 'paragraph');
                ancestor.remove();
                return;
            }
        }
        let pos = newElement.textContent.length;
        newElement.focus();
        newElement.textContent += textAfterCaret;
        caretPosition(newElement, 'set', pos);
        return newElement;
    }
}


function splitList(targetNode) {
    let previousListItem = [];
    let nextListItem = [];
    let listItem = targetNode.parentNode.closest(`[data-name=${targetNode.getAttribute('data-name')}] > *`) || targetNode;
    while (listItem.previousElementSibling) {
        previousListItem.unshift(listItem.previousElementSibling);
        listItem = listItem.previousElementSibling;
    }
    
    listItem = targetNode.parentNode.closest(`[data-name=${targetNode.getAttribute('data-name')}] > *`) || targetNode;

    while (listItem.nextElementSibling) {
        nextListItem.unshift(listItem.nextElementSibling);
        listItem = listItem.nextElementSibling;
    }
    let actualList = targetNode.parentNode.closest(`[data-name=${targetNode.getAttribute('data-name')}]`);
    const newListBefore = document.createElement(actualList.tagName);
    const newListAfter = document.createElement(actualList.tagName);
    newListBefore.appendChild(targetNode.parentNode.closest(`[data-name=${targetNode.getAttribute('data-name')}] > *`) || targetNode);
    actualList.replaceWith(newListBefore, newListAfter);
    previousListItem.forEach(item => newListBefore.appendChild(item));
    nextListItem.reverse().forEach(item => newListAfter.appendChild(item));

    Array.from(actualList.attributes).forEach(attr => {
        newListBefore.setAttribute(attr.name, attr.value);
        newListAfter.setAttribute(attr.name, attr.value);
    });
    return targetNode;
}

// Helper functions
// 1. Get/Set caret position
// 2. Find commands details

function findSibling(node, adjacent) {
    let direction = adjacent === 'previous' ? 'previousElementSibling' : 'nextElementSibling';
    let method = adjacent === 'previous' ? 'pop' : 'shift';
    let ancestor = node?.parentNode?.closest(`[data-name=${node.getAttribute('data-name')}]`);
    let sibling = null;

    if (ancestor) {
        let ancestorChildren = Array.from(ancestor.querySelectorAll('[contenteditable]'));
        let index = ancestorChildren.indexOf(node);
        sibling =ancestorChildren[index + (adjacent === 'previous' ? -1 : 1)] || (ancestor[direction] && [...ancestor[direction].querySelectorAll('[contenteditable]')][method]()) || (ancestor[direction]?.hasAttribute('contenteditable') ? ancestor[direction] : null);
    } else {
        sibling = (node[direction] && [...node[direction].querySelectorAll('[contenteditable]')][method]()) || (node[direction]?.hasAttribute('contenteditable') ? node[direction] : null);
    }
    return sibling;
}

function caretPosition(element, action = 'get', position = 0) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return 0; // Ensure a selection exists.
    const range = selection.getRangeAt(0);

    if (action === 'get') {
        const tempRange = range.cloneRange();
        tempRange.selectNodeContents(element);
        tempRange.setEnd(range.endContainer, range.endOffset);
        return tempRange.toString().length;
    } else if (action === 'set') {
        let textNode = element.firstChild;

        if (!textNode) {
            element.textContent = ''; // Ensure there is a text node
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

const commandLookup = new Map();
Object.keys(commands).forEach(category => {
    commands[category].forEach(command => {
        commandLookup.set(command.Name, { ...command, category });
    });
});

function getCommandDetail(name, detail = null) {
    const command = commandLookup.get(name);
    return command ? (detail ? command[detail] : command.category) : null;
}

// Command palette gestions
// 1. Fetch SVG icons
// 2. Populate command palette
// 3. Reset command palette
// 4. Filter command palette
// 5. Handle key navigation

async function fetchSVG(commandName) {
    const svgPromises = commandName.map(async (name) => {
        try {
            const response = await fetch(`icon/${name}.svg`);
            return response.ok ? await response.text() : null;   
        } catch (error) {
            console.error(`Failed to fetch SVG: ${name}`, error);
            return null;
        }
    });
    return await Promise.all(svgPromises);
}

async function populateCommandPalette() {
    const allCommands = Object.values(commands).flat();
    const commandNames = allCommands.map(cmd => cmd.Name);
    const svgs = await fetchSVG(commandNames);

    for (const [category, categoryCommands] of Object.entries(commands)) {
        const container = document.createElement('div');
        container.classList.add('command-section');

        const header = document.createElement('h4');
        header.textContent = category;
        container.appendChild(header);

        const ul = document.createElement('ul');

        for (const command of categoryCommands) {
            const li = document.createElement('li');
            li.classList.add('command-item');
            const svgIndex = allCommands.findIndex(cmd => cmd.Name === command.Name);
            const svgContent = svgs[svgIndex] || '';

            li.innerHTML = `
                <button onclick="addItems(targetNode, '${command.Name}')">
                    ${svgContent}
                    <h5>${command.Name}</h5>
                </button>`;
            ul.appendChild(li);
        }
        container.appendChild(ul);
        commandPalette.appendChild(container);
    }
}

function resetCommandPalette(target) {
    const sections = commandPalette.querySelectorAll('.command-section');
    commandInput.value = '';
    sections.forEach(section => {
        section.style.display = '';
        const items = section.querySelectorAll('.command-item');
        items.forEach(item => {item.style.display = '';});
    });
    commandPalette.querySelector('.select')?.classList.remove('select');
    if (target) {
        target || noteContainer.querySelector('[contenteditable]').focus();
        caretPosition(target || noteContainer.querySelector('[contenteditable]'), 'set', lastCaretPosition);
    }
    commandPaletteContainer.hidePopover();
}

function filterCommandPalette(searchTerm) {
    const sections = commandPalette.querySelectorAll('.command-section');
    let firstMatch = null;
    commandPalette.querySelectorAll('.select').forEach(item => { item.classList.remove('select'); });

    sections.forEach(section => {
        const header = section.querySelector('h4');
        const items = section.querySelectorAll('.command-item');
        const searchLower = searchTerm.toLowerCase();    
        let sectionMatch = header.textContent.toLowerCase().includes(searchLower);
        let itemMatch = false;

        items.forEach(item => {
            const commandName = item.querySelector('h5').textContent.toLowerCase();

            if (sectionMatch || commandName.includes(searchLower)) {
                item.style.display = '';
                firstMatch ||= item;
                itemMatch = true;
            } else {
                item.style.display = 'none';
            }
        });

        sectionMatch || itemMatch ? section.style.display = '' : section.style.display = 'none';
    }); 
    firstMatch?.classList.add('select');
}

function handleKeyNavigation(e) {
    const commandPalette = document.querySelector('#command-palette');
    const selected = commandPalette.querySelector('.select');
    const allItems = Array.from(commandPalette.querySelectorAll('.command-item'))
        .filter(item => item.style.display !== 'none');

    let newSelected;
    const currentIndex = allItems.indexOf(selected);

    if (e.key === 'Backspace' && !commandInput.value) {
        e.preventDefault();
        resetCommandPalette(targetNode);
        return;
    }

    if (e.key === 'Escape') {
        e.preventDefault();
        resetCommandPalette(targetNode);
        return;
    }

    if (commandInput.value.length > 5 && !selected) {
        targetNode.textContent += `/${commandInput.value}`;
        resetCommandPalette(targetNode);
        return
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        newSelected = allItems[(currentIndex + 1) % allItems.length];
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newSelected = allItems[(currentIndex - 1 + allItems.length) % allItems.length];
    } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        const commandType = selected.querySelector('h5').textContent;
        addItems(targetNode, commandType);
        resetCommandPalette();
        return;
    }

    if (newSelected) {
        selected?.classList.remove('select');
        newSelected.classList.add('select');
        newSelected.scrollIntoView({ block: 'nearest' });
    }
}

// Event listeners & initializations
// 1. Initialize command palette
// 2. Handle key navigation

populateCommandPalette();
commandInput.addEventListener('keydown', handleKeyNavigation);
commandInput.addEventListener('input', (e) => { filterCommandPalette(e.target.value)});
commandInput.addEventListener('blur', () => resetCommandPalette(targetNode));
noteContainer.addEventListener('focusin', (e) => {
    const newTargetNode = e.target.closest('[contenteditable="true"]') || (() => { return; })();
    if (targetNode && targetNode !== newTargetNode) {
        targetNode.removeAttribute('data-target');
    }
    targetNode = newTargetNode;
    if (targetNode) {
        targetNode.setAttribute('data-target', 'true');
    }
});

const saveButton = document.getElementById('save-button');

// Load saved notes when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedNotes = localStorage.getItem('noteContent');
    if (savedNotes) {
        noteContainer.innerHTML = savedNotes;
    }
});

// Save notes to localStorage when the button is clicked
saveButton.addEventListener('click', () => {
    const content = noteContainer.innerHTML;
    localStorage.setItem('noteContent', content);
    alert('Notes saved!');
});

// Optionally, save automatically when content changes
noteContainer.addEventListener('input', () => {
    localStorage.setItem('noteContent', noteContainer.innerHTML);
});