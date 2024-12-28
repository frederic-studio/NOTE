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
        targetNode = newElement;
    }

    if (e.key === "/") {
        e.preventDefault();
        if (!e.target.textContent) e.target.innerHTML = '';
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
        console.log('lastChild', lastChild)
        console.log('targetNode', targetNode)
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
            if (target.previousElementSibling.getAttribute('data-name') === target.nextElementSibling?.getAttribute('data-name')) {
                newElement = (contentEditableElements ?? []).length > 0 ? Array.from(contentEditableElements).pop() : target.previousElementSibling.querySelector('[contenteditable]') || target.previousElementSibling;
                let listBefore = target.previousElementSibling;
                let listAfter = target.nextElementSibling;
                while (listAfter.firstElementChild) {
                    listBefore.appendChild(listAfter.firstElementChild);
                }
                listAfter.remove();
                target.remove();
            }
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

function splitList(targetNode) {
    console.log('splitList')
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

// Helper function
function findSibling(node, isNext) {
    const direction = isNext ? 'nextElementSibling' : 'previousElementSibling';
    const method = isNext ? 'shift' : 'pop';

    // Direct sibling
    let sibling = node[direction];
    if (sibling?.hasAttribute('contenteditable')) return sibling;

    // Ancestor sibling
    let ancestor = node.parentNode?.closest(`[data-name='${node.getAttribute('data-name')}'] > *`);
    if (ancestor?.[direction]) {
        const elements = Array.from(ancestor[direction].querySelectorAll('[contenteditable]')) || [];
        sibling = elements[method]() || ancestor[direction];
        if (sibling) return sibling;
    }

    // Container level sibling
    let parent = node.closest('#note-container > *');
    if (parent?.[direction]) {
        const elements = Array.from(parent[direction].querySelectorAll('[contenteditable]')) || [];
        sibling = elements[method]() || parent[direction];
        if (sibling) return sibling;
    }

    return null;
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
noteContainer.addEventListener('focusin', (e) => {
    if (e.shiftKey) return;
    document.querySelectorAll('.selected').forEach(child => {
        child.classList.remove('selected');
    });
    const newTargetNode = e.target.closest('[contenteditable="true"]') || (() => { return; })();
    if (targetNode && targetNode !== newTargetNode) {
        targetNode.removeAttribute('data-target');
    }
    targetNode = newTargetNode;
    if (targetNode) {
        targetNode.setAttribute('data-target', 'true');
    }
});


function initializeSelectionRectangle() {
    let isMouseDown = false;
    let startX, startY;
    const selectionRectangle = document.createElement('div');
    selectionRectangle.style.position = 'absolute';
    selectionRectangle.style.border = '2px solid #395cc6';
    selectionRectangle.style.backgroundColor = '#395cc622';
    selectionRectangle.style.borderRadius = '5px';
    selectionRectangle.style.pointerEvents = 'none';
    document.body.appendChild(selectionRectangle);

    document.addEventListener('mousedown', (e) => {
        if (!noteContainer.contains(e.target)) {
            isMouseDown = true;
            startX = e.pageX;
            startY = e.pageY;
            selectionRectangle.style.left = `${startX}px`;
            selectionRectangle.style.top = `${startY}px`;
            selectionRectangle.style.width = '0px';
            selectionRectangle.style.height = '0px';
            selectionRectangle.style.display = 'block';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        const currentX = e.pageX;
        const currentY = e.pageY;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        selectionRectangle.style.width = `${width}px`;
        selectionRectangle.style.height = `${height}px`;
        selectionRectangle.style.left = `${Math.min(currentX, startX)}px`;
        selectionRectangle.style.top = `${Math.min(currentY, startY)}px`;

        noteContainer.querySelectorAll('[contenteditable]').forEach(child => {
            const rect = child.getBoundingClientRect();
            const isInSelection = !(
                rect.right < Math.min(startX, currentX) ||
                rect.left > Math.max(startX, currentX) ||
                rect.bottom < Math.min(startY, currentY) ||
                rect.top > Math.max(startY, currentY)
            );
            if (isInSelection) {
                child.classList.add('selected');
            } else {
                child.classList.remove('selected');
            }
        });

        if (currentY < window.scrollY + 50) {
            window.scrollBy(0, -10);
        } else if (currentY > window.scrollY + window.innerHeight - 50) {
            window.scrollBy(0, 10);
        }
    });

    let isMouseUp = false;

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
        isMouseUp = true;
        selectionRectangle.style.display = 'none';
        setTimeout(() => { isMouseUp = false; }, 0);
    });

    document.addEventListener('click', (e) => {
        if (isMouseUp) return;
        if (e.shiftKey) {
            const selectedNode = e.target.closest('.selected');
            if (selectedNode) {
                selectedNode.classList.remove('selected');
                return;
            }
        }
        document.querySelectorAll('.selected').forEach(child => {
            console.log('el caca!')
            child.classList.remove('selected');
        });
    });

    noteContainer.addEventListener('focusin', (e) => {
        if (e.shiftKey) return;
        document.querySelectorAll('.selected').forEach(child => {
            child.classList.remove('selected');
        });
    });
}

const range = document.getElementById('ch');
const rangeSpan = document.getElementById('ch-value');
range.value = noteContainer.getAttribute('data-width');
rangeSpan.textContent = range.value;

range.addEventListener('input', (e) => {
    rangeSpan.textContent = e.target.value;
    noteContainer.setAttribute('data-width', e.target.value);
    noteContainer.style.width = e.target.value + 'ch';
});

initializeSelectionRectangle();