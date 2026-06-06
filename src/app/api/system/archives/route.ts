import { NextRequest, NextResponse } from 'next/server';

// Mock archives database with files from different years (some expired, some active under different rules)
const mockArchiveFiles = [
  // Archive from 2020 (Expired under 5 years, visible under 7+ years)
  { fileName: 'audit_logs_2020_05.json.gz', fileSize: '120 KB', endDate: '2020-05-31', dateRange: '2020-05-01 to 2020-05-31', recordsCount: 950, bucket: 'cold-storage-archives' },
  // Archive from 2021 (Expired under 5 years, visible under 7+ years)
  { fileName: 'audit_logs_2021_03.json.gz', fileSize: '150 KB', endDate: '2021-03-31', dateRange: '2021-03-01 to 2021-03-31', recordsCount: 1200, bucket: 'cold-storage-archives' },
  // Active archives
  { fileName: 'audit_logs_2024_08.json.gz', fileSize: '190 KB', endDate: '2024-08-31', dateRange: '2024-08-01 to 2024-08-31', recordsCount: 1640, bucket: 'cold-storage-archives' },
  { fileName: 'audit_logs_2025_12.json.gz', fileSize: '205 KB', endDate: '2025-12-31', dateRange: '2025-12-01 to 2025-12-31', recordsCount: 1810, bucket: 'cold-storage-archives' },
  { fileName: 'audit_logs_2026_01.json.gz', fileSize: '184 KB', endDate: '2026-01-31', dateRange: '2026-01-01 to 2026-01-31', recordsCount: 1450, bucket: 'cold-storage-archives' },
  { fileName: 'audit_logs_2026_02.json.gz', fileSize: '210 KB', endDate: '2026-02-28', dateRange: '2026-02-01 to 2026-02-28', recordsCount: 1980, bucket: 'cold-storage-archives' },
];

const mockArchiveContents: Record<string, any[]> = {
  'audit_logs_2020_05.json.gz': [
    { logId: 'arch20-1', tableName: 'system_access', recordId: '192.168.1.10', actionType: 'LOGIN', actorName: 'Adam Roy', createdAt: '2020-05-15T08:30:00Z', newData: { status: 'SUCCESS' } }
  ],
  'audit_logs_2021_03.json.gz': [
    { logId: 'arch21-1', tableName: 'employees', recordId: 'EMP-001', actionType: 'UPDATE', actorName: 'Maria Santos', createdAt: '2021-03-20T14:20:00Z', newData: { position: 'Designer' } }
  ],
  'audit_logs_2024_08.json.gz': [
    { logId: 'arch24-1', tableName: 'reports_engine', recordId: 'REP-PAYROLL-2024', actionType: 'GENERATE', actorName: 'Ronald Richards', createdAt: '2024-08-10T11:00:00Z', newData: { format: 'PDF' } }
  ],
  'audit_logs_2025_12.json.gz': [
    { logId: 'arch25-1', tableName: 'system_access', recordId: '192.168.1.55', actionType: 'LOGIN', actorName: 'Maria Santos', createdAt: '2025-12-05T09:15:00Z', newData: { status: 'SUCCESS' } }
  ],
  'audit_logs_2026_01.json.gz': [
    { logId: 'arch1-1', tableName: 'system_access', recordId: '192.168.1.50', actionType: 'LOGIN', actorName: 'Adam Roy', createdAt: '2026-01-15T08:30:00Z', newData: { status: 'SUCCESS', method: 'Password' } }
  ],
  'audit_logs_2026_02.json.gz': [
    { logId: 'arch2-1', tableName: 'system_access', recordId: '192.168.1.55', actionType: 'LOGIN', actorName: 'Ronald Richards', createdAt: '2026-02-10T09:15:00Z', newData: { status: 'SUCCESS' } }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    const retentionParam = searchParams.get('retentionYears');
    const retentionYears = retentionParam ? parseInt(retentionParam, 10) : 5;

    if (fileName) {
      const contents = mockArchiveContents[fileName] || [];
      return NextResponse.json({ fileName, contents });
    }

    const currentDate = new Date('2026-06-05'); // Current system context date

    // Map and filter active archives based on retention policies
    const processedArchives = mockArchiveFiles
      .map(file => {
        const fileEnd = new Date(file.endDate);
        const purgeDate = new Date(fileEnd.setFullYear(fileEnd.getFullYear() + retentionYears));
        
        return {
          ...file,
          purgeDate: purgeDate.toISOString().split('T')[0],
          isExpired: purgeDate < currentDate
        };
      })
      .filter(file => !file.isExpired); // Auto-purge expired archives

    return NextResponse.json(processedArchives);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
