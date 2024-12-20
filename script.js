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
    targetNode = e.target.closest('[contenteditable="true"]') || (() => { return; })();
    
    if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace(e);
    }

    if (e.key === "Enter") {
        e.preventDefault();
        const newElement = addItems(targetNode);
        targetNode = newElement;
    }

    if (e.key === "/") {
        e.preventDefault();
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
        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        const endOffset = range.endOffset;
        const newText = textContent.slice(0, startOffset) + textContent.slice(endOffset);
        e.target.textContent = newText;
        caretPosition(e.target, 'set', startOffset);
    } else {
        if (textContent.length === 1 && caretPos === 1) {
            e.target.innerHTML = '';
        } else if (caretPos === 0 && !e.target.classList.contains('title-page')) {
            if (e.target.tagName !== 'P' && getCommandDetail(e.target.getAttribute('data-name')) !== 'List') {
                addItems(e.target, 'paragraph');
                handleRemovingNode('Empty', e.target);
                return;
            }
            handleRemovingNode(null, e.target);
        } else if (caretPos > 0) {
            const newText = textContent.slice(0, caretPos - 1) + textContent.slice(caretPos);
            e.target.textContent = newText;
            caretPosition(e.target, 'set', caretPos - 1);
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
    let newElement;

    if (newType) {
        newElement = clone.firstElementChild;
        const ancestor = targetNode.closest('#note-container > *');
        (ancestor ? ancestor : targetNode).insertAdjacentElement('afterend', newElement);
        handleRemovingNode('Empty', targetNode, newType);
    } else if (!targetNode.textContent) {
        return addItems(targetNode, 'paragraph');
    } else {
        let e = clone.firstElementChild.children[0];
        targetNode.parentNode.closest(`[data-name='${newItem}'] > *`).insertAdjacentElement('afterend', e);
        newElement = e.querySelector('[contenteditable]') || e;
    }

    newElement.hasAttribute('contenteditable') 
        ? newElement.focus() 
        : newElement.querySelector('[contenteditable]').focus();

    (newElement.querySelector('[contenteditable]') || newElement).textContent = textAfterCaret;
    return newElement;
}

function handleRemovingNode(action, target, newType) {
    let newElement;
    let targetParent = target.parentNode?.closest(`[data-name='${target.getAttribute('data-name')}']`);
    let contentEditableElements = target.previousElementSibling?.querySelectorAll('[contenteditable]');
    let textAfterCaret = targetNode.textContent.substring(caretPosition(targetNode, 'get'));

    if (action === 'Empty') {
        if (!target.textContent && !target.classList.contains('title-page') && newType) {
            let ancestor = target.parentNode.closest(`[data-name="${target.getAttribute('data-name')}"]`);
            if (ancestor) {
                let childToRemove = Array.from(ancestor.children).find(child => child.contains(target));
                ancestor.children.length > 1 ? childToRemove?.remove() : ancestor.remove();
            } else {
                target.remove();
            }
        }
        return;
    } else {
        if (!targetParent) {
            newElement = (contentEditableElements ?? []).length > 0 ? Array.from(contentEditableElements).pop() : target.previousElementSibling.querySelector('[contenteditable]') || target.previousElementSibling;
            target.remove();
        } else {
            let currentNode = target;
            while (currentNode.parentNode !== targetParent) {currentNode = currentNode.parentNode;}
            if (targetParent.children.length > 1) {
                newElement = currentNode === targetParent.children[0]
                    ? targetParent.previousElementSibling?.querySelector('[contenteditable]') || targetParent.previousElementSibling
                    : currentNode.previousElementSibling.querySelector('[contenteditable]') || currentNode.previousElementSibling;
                currentNode.remove();
            } else {
                newElement = addItems(target, 'paragraph');
                targetParent.remove();
                return;
            }
        }
        let pos =  newElement.textContent.length;
        newElement.focus();
        newElement.textContent += textAfterCaret;
        caretPosition(newElement, 'set', pos);
        return newElement;
    }
}

// Helper functions
// 1. Get/Set caret position
// 2. Find commands details

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
        caretPosition(target || noteContainer.querySelector('[contenteditable]'), 'set', 'end');
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
noteContainer.addEventListener('focusin', (e) => {caretPosition(e.target, 'set', 'end');});


