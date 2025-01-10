function funzo() {
    const nodesArray = [];
    Array.from(noteContainer.children).forEach(node => {
        let checkboxes = Array.from(node.querySelectorAll('input[type="checkbox"]'));
        let dataNameElements = Array.from(node.querySelectorAll(`[data-name='${node.getAttribute('data-name')}']`));

        let nodeObject = {
            Name: node.getAttribute('data-name'),
            Indent: node.getAttribute('data-indent'),
            Checked: checkboxes.length > 0 ? checkboxes.map(checkbox => checkbox.checked ? 1 : 0) : null,
            textContent: dataNameElements.length > 0 ? dataNameElements.map(li => li.textContent) : [node.textContent || '']
        };

        nodesArray.push(nodeObject);
    });
    return getJSONSize(nodesArray);
}

function getJSONSize(jsonObject) {
    // Convert JSON object to a string
    const jsonString = JSON.stringify(jsonObject);  
    const sizeInBytes = new TextEncoder().encode(jsonString).length;  // Measure byte length
    const sizeInMb = sizeInBytes / (1024 * 1024);  // Convert to MB

    // Get the size of the content in innerHTML (ensure it's a string and not pure HTML)
    const htmlContent = noteContainer.innerHTML;  // Content from the container
    const htmlSizeInBytes = new TextEncoder().encode(htmlContent).length;
    const htmlSizeInMb = htmlSizeInBytes / (1024 * 1024);  // Convert to MB
    
    console.log('JSONString:', jsonString)
    console.log('JSON Size in Bytes:', sizeInBytes);
    console.log('JSON Size in MB:', sizeInMb);
    console.log('HTML Content Size in Bytes:', htmlSizeInBytes);
    console.log('HTML Content Size in MB:', htmlSizeInMb);
}