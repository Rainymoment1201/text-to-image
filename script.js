document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const textInput = document.getElementById('textInput');
    const fileInput = document.getElementById('fileInput');
    const bgColor = document.getElementById('bgColor');
    const textColor = document.getElementById('textColor');
    const fontSize = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const fontFamily = document.getElementById('fontFamily');
    const fontWeight = document.getElementById('fontWeight');
    const generateBtn = document.getElementById('generateBtn');
    const previewContainer = document.getElementById('previewContainer');
    const saveAllBtn = document.getElementById('saveAllBtn');
    
    // 设置默认值 - 备忘录风格
    bgColor.value = "#FFFEF5"; // 备忘录淡黄色背景
    textColor.value = "#333333"; // 深灰色文字
    fontSize.value = 14; // 更小的字体大小
    fontSizeValue.textContent = `${fontSize.value}px`;
    
    // 图片分辨率倍数 - 提高清晰度
    const RESOLUTION_MULTIPLIER = 3;
    
    // 更新字体大小显示
    fontSize.addEventListener('input', function() {
        fontSizeValue.textContent = `${fontSize.value}px`;
    });
    
    // 处理文件上传
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                textInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // 生成图片按钮点击事件
    generateBtn.addEventListener('click', function() {
        const text = textInput.value.trim();
        if (!text) {
            alert('请输入文字内容');
            return;
        }
        
        // 清空预览区域
        previewContainer.innerHTML = '';
        
        // 分割文本并生成图片
        const textChunks = splitTextIntoChunks(text);
        
        if (textChunks.length > 0) {
            textChunks.forEach((chunk, index) => {
                createImageFromText(chunk, index);
            });
            
            // 启用保存全部按钮
            saveAllBtn.disabled = false;
        }
    });
    
    // 保存全部图片
    saveAllBtn.addEventListener('click', function() {
        const images = document.querySelectorAll('.preview-image');
        if (images.length === 0) return;
        
        // 如果只有一张图片，直接下载
        if (images.length === 1) {
            downloadImage(images[0], 'note-image');
            return;
        }
        
        // 多张图片，创建一个zip文件
        if (images.length > 1) {
            // 由于浏览器限制，我们使用一个简单的方法：逐个下载
            images.forEach((img, index) => {
                // 延迟下载，避免浏览器阻止多个下载
                setTimeout(() => {
                    downloadImage(img, `note-image-${index + 1}`);
                }, index * 500);
            });
        }
    });
    
    // 分割文本为多个块，适合3:4比例的图片，保留原始换行
    function splitTextIntoChunks(text) {
        // 将文本按照原始换行符分割成行
        const lines = text.split('\n');
        
        // 估算每个图片可以容纳的行数
        const fontSizeVal = parseInt(fontSize.value);
        const lineHeight = fontSizeVal * 1.5;
        const canvasHeight = 400; // 3:4比例的高度
        const padding = 30; // 上下左右的内边距
        const availableHeight = canvasHeight - (padding * 2);
        const linesPerImage = Math.floor(availableHeight / lineHeight);
        
        // 分割文本
        const chunks = [];
        let currentChunk = [];
        let currentLineCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检查单行是否需要进一步分割（如果太长）
            const canvasWidth = 300; // 3:4比例的宽度
            const availableWidth = canvasWidth - (padding * 2);
            const ctx = document.createElement('canvas').getContext('2d');
            const selectedFont = `${fontWeight.value} ${fontSize.value}px ${fontFamily.value}`;
            ctx.font = selectedFont;
            
            // 如果这一行太长，需要进一步分割
            if (ctx.measureText(line).width > availableWidth) {
                const subLines = splitLongLine(line, availableWidth, ctx);
                
                for (const subLine of subLines) {
                    if (currentLineCount >= linesPerImage) {
                        // 当前图片已满，创建新的图片
                        chunks.push(currentChunk.join('\n'));
                        currentChunk = [];
                        currentLineCount = 0;
                    }
                    
                    currentChunk.push(subLine);
                    currentLineCount++;
                }
            } else {
                // 这一行不需要分割
                if (currentLineCount >= linesPerImage) {
                    // 当前图片已满，创建新的图片
                    chunks.push(currentChunk.join('\n'));
                    currentChunk = [];
                    currentLineCount = 0;
                }
                
                currentChunk.push(line);
                currentLineCount++;
            }
        }
        
        // 添加最后一个块
        if (currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
        }
        
        return chunks;
    }
    
    // 分割过长的行
    function splitLongLine(line, maxWidth, ctx) {
        const words = line.split('');
        const subLines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + word;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && currentLine) {
                subLines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            subLines.push(currentLine);
        }
        
        return subLines;
    }
    
    // 从文本创建图片
    function createImageFromText(text, index) {
        // 创建canvas元素 - 使用更高的分辨率
        const canvas = document.createElement('canvas');
        const baseWidth = 300; // 3:4比例的宽度
        const baseHeight = 400; // 3:4比例的高度
        
        // 设置高分辨率画布
        canvas.width = baseWidth * RESOLUTION_MULTIPLIER;
        canvas.height = baseHeight * RESOLUTION_MULTIPLIER;
        canvas.style.width = `${baseWidth}px`;
        canvas.style.height = `${baseHeight}px`;
        
        const ctx = canvas.getContext('2d');
        
        // 启用抗锯齿
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 缩放上下文以匹配高分辨率
        ctx.scale(RESOLUTION_MULTIPLIER, RESOLUTION_MULTIPLIER);
        
        // 设置背景 - iOS备忘录风格
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        
        // 添加纸张纹理效果
        addPaperTexture(ctx, baseWidth, baseHeight);
        
        // 添加顶部的线条 - iOS备忘录风格
        ctx.strokeStyle = '#E6E6E6';
        ctx.lineWidth = 1 / RESOLUTION_MULTIPLIER; // 调整线宽以适应高分辨率
        ctx.beginPath();
        ctx.moveTo(15, 15);
        ctx.lineTo(baseWidth - 15, 15);
        ctx.stroke();
        
        // 设置文本样式
        ctx.fillStyle = textColor.value;
        const selectedFont = `${fontWeight.value} ${fontSize.value}px ${fontFamily.value}`;
        ctx.font = selectedFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // 绘制文本，保留换行
        const lineHeight = parseInt(fontSize.value) * 1.5;
        const padding = 30;
        
        // 分割文本为行
        const lines = text.split('\n');
        
        // 绘制每一行
        lines.forEach((line, lineIndex) => {
            ctx.fillText(line, padding, padding + (lineIndex * lineHeight));
        });
        
        // 添加底部的线条 - iOS备忘录风格
        ctx.strokeStyle = '#E6E6E6';
        ctx.beginPath();
        ctx.moveTo(15, baseHeight - 15);
        ctx.lineTo(baseWidth - 15, baseHeight - 15);
        ctx.stroke();
        
        // 将canvas转换为图片 - 使用高质量输出
        const imageUrl = canvas.toDataURL('image/png', 1.0);
        
        // 创建预览元素
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'preview-image';
        img.alt = `备忘录图片 ${index + 1}`;
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.innerHTML = '<i class="fas fa-download" style="margin-right: 5px;"></i> 保存';
        saveBtn.addEventListener('click', function() {
            downloadImage(img, `note-image-${index + 1}`);
        });
        
        previewItem.appendChild(img);
        previewItem.appendChild(saveBtn);
        previewContainer.appendChild(previewItem);
    }
    
    // 添加纸张纹理效果
    function addPaperTexture(ctx, width, height) {
        // 添加轻微的噪点纹理
        ctx.save();
        ctx.scale(1/RESOLUTION_MULTIPLIER, 1/RESOLUTION_MULTIPLIER);
        
        for (let i = 0; i < width * height * 0.01 * RESOLUTION_MULTIPLIER * RESOLUTION_MULTIPLIER; i++) {
            const x = Math.random() * width * RESOLUTION_MULTIPLIER;
            const y = Math.random() * height * RESOLUTION_MULTIPLIER;
            const opacity = Math.random() * 0.02;
            
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        ctx.restore();
        
        // 添加轻微的横线 - 类似笔记本纸
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 0.5 / RESOLUTION_MULTIPLIER;
        
        for (let y = 50; y < height; y += 25) {
            ctx.beginPath();
            ctx.moveTo(15, y);
            ctx.lineTo(width - 15, y);
            ctx.stroke();
        }
    }
    
    // 下载图片
    function downloadImage(imgElement, filename) {
        // 创建一个临时链接来下载高分辨率图片
        const a = document.createElement('a');
        a.href = imgElement.src;
        a.download = `${filename}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}); 