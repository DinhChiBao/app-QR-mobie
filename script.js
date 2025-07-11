let qrList = [];
let html5QrCode = null;

const input = document.getElementById('qrInput');
const message = document.getElementById('message');
const tableBody = document.querySelector('#qrTable tbody');
const searchInput = document.getElementById('searchInput');
const videoElement = document.getElementById('video');

// Enter để thêm mã
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addQR();
  }
});

// Tìm kiếm
searchInput.addEventListener('input', function () {
  const keyword = this.value.toLowerCase();
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    const qrCode = row.cells[1].textContent.toLowerCase();
    row.style.display = qrCode.includes(keyword) ? '' : 'none';
  });
});

// Thêm mã QR
function addQR() {
  const raw = input.value.trim();
  const values = raw.split(/[\n\r,]+/);

  let duplicateMessage = '';
  let added = 0;

  values.forEach((code) => {
    code = code.trim();
    if (!code) return;

    const index = qrList.indexOf(code);
    if (index !== -1) {
      duplicateMessage += `❌ Trùng dòng ${index + 1}: ${code}\n`;
    } else {
      qrList.push(code);
      added++;
    }
  });

  if (duplicateMessage) {
    message.textContent = duplicateMessage.trim();
  } else {
    message.textContent = `${added} mã đã được thêm thành công!`;
  }

  input.value = '';
  input.focus();
  renderTable();
}

// Hiển thị danh sách
function renderTable() {
  tableBody.innerHTML = '';
  qrList.forEach((code, index) => {
    const row = tableBody.insertRow();
    row.insertCell(0).textContent = index + 1;
    row.insertCell(1).textContent = code;
    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.onclick = () => deleteQR(index);
    row.insertCell(2).appendChild(delBtn);
  });
}

// Xóa dòng
function deleteQR(index) {
  qrList.splice(index, 1);
  renderTable();
}

// Xóa tất cả
function clearAll() {
  if (confirm("Bạn có chắc muốn xoá tất cả?")) {
    qrList = [];
    renderTable();
  }
}

// Quét bằng Camera
async function startScan() {
  if (html5QrCode) {
    await html5QrCode.stop().catch(()=>{});
    html5QrCode.clear();
  }

  html5QrCode = new Html5Qrcode("video");
  try {
    const devices = await Html5Qrcode.getCameras();
    if (!devices.length) return alert("Không tìm thấy camera");

    const backCam = devices.find(d => d.label.toLowerCase().includes('back'));
    const camId = backCam ? backCam.id : devices[0].id;

    html5QrCode.start(
      camId,
      { fps: 10, qrbox: 250 },
      qr => {
        input.value = qr;
        addQR();
        stopScan();
      },
      err => {}
    );
    videoElement.style.display = 'block';
  } catch (e) {
    alert("Không thể mở camera: " + e);
  }
}

// Dừng quét
function stopScan() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      videoElement.style.display = 'none';
    }).catch(console.error);
  }
}

// Xuất Excel
function exportToExcel() {
  const ws = XLSX.utils.json_to_sheet(
    qrList.map((code, index) => ({ STT: index + 1, "Mã QR": code }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DanhSachQR");
  XLSX.writeFile(wb, "ma_qr.xlsx");
}
