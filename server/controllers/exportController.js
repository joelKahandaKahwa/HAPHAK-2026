const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { prisma } = require('../config/database');

// Reconstruit les mêmes filtres que listRegistrations, pour que l'export
// respecte exactement ce que l'administrateur a filtré à l'écran.
function buildWhere(query) {
  const { search, city, gender, memberOnly, accommodation, present, dateFrom, dateTo } = query;
  const where = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { registrationNumber: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (city) where.city = { equals: city, mode: 'insensitive' };
  if (gender) where.gender = gender;
  if (memberOnly === 'true') where.organizationMember = true;
  if (memberOnly === 'false') where.organizationMember = false;
  if (accommodation === 'true') where.accommodationRequired = true;
  if (accommodation === 'false') where.accommodationRequired = false;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (present === 'true') where.attendance = { is: { status: 'PRESENT' } };
  if (present === 'false') where.attendance = { is: null };

  return where;
}

const EXPORT_FIELDS = [
  'registrationNumber', 'lastName', 'middleName', 'firstName', 'gender', 'maritalStatus',
  'phone', 'whatsapp', 'email', 'city', 'commune', 'province', 'country',
  'organizationMember', 'accommodationRequired', 'accommodationType', 'status', 'createdAt',
];

async function fetchFiltered(query) {
  const where = buildWhere(query);
  return prisma.registration.findMany({ where, orderBy: { createdAt: 'desc' } });
}

// GET /api/admin/export/csv
async function exportCsv(req, res, next) {
  try {
    const rows = await fetchFiltered(req.query);
    const parser = new Parser({ fields: EXPORT_FIELDS });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`haphak-participants-${Date.now()}.csv`);
    res.send('\uFEFF' + csv); // BOM pour compatibilité Excel/accents
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/export/excel
async function exportExcel(req, res, next) {
  try {
    const rows = await fetchFiltered(req.query);
    const flat = rows.map((r) => {
      const out = {};
      EXPORT_FIELDS.forEach((f) => { out[f] = r[f]; });
      return out;
    });

    const worksheet = XLSX.utils.json_to_sheet(flat);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment(`haphak-participants-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/export/pdf
async function exportPdf(req, res, next) {
  try {
    const rows = await fetchFiltered(req.query);

    res.header('Content-Type', 'application/pdf');
    res.attachment(`haphak-participants-${Date.now()}.pdf`);

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(16).text('HAPHAK 2026 — Liste des participants', { align: 'center' });
    doc.moveDown();

    const headers = ['N°', 'Nom complet', 'Téléphone', 'Ville', 'Sexe', 'Statut'];
    const colWidths = [90, 160, 100, 100, 60, 90];

    function drawRow(y, values, isHeader = false) {
      let x = 30;
      doc.fontSize(9).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      values.forEach((v, i) => {
        doc.text(String(v ?? ''), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
    }

    let y = doc.y;
    drawRow(y, headers, true);
    y += 18;

    rows.forEach((r) => {
      if (y > 520) {
        doc.addPage();
        y = 40;
        drawRow(y, headers, true);
        y += 18;
      }
      drawRow(y, [
        r.registrationNumber,
        `${r.firstName} ${r.lastName}`,
        r.phone,
        r.city,
        r.gender,
        r.status,
      ]);
      y += 16;
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { exportCsv, exportExcel, exportPdf };
