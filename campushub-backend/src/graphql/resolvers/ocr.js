const { query } = require('../../config/database');

const ocrResolvers = {
  Query: {
    verificationStatus: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const result = await query(
        `SELECT * FROM student_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [user.userId]
      );
      if (result.rows.length === 0) {
        return { status: 'UNVERIFIED', message: 'No verification submitted' };
      }
      const v = result.rows[0];
      return {
        status: v.status,
        studentId: v.student_id_number,
        university: v.university,
        department: v.department,
        verifiedAt: v.verified_at,
        message: v.status === 'VERIFIED' ? 'Student ID verified' : 'Verification pending'
      };
    }
  },
  Mutation: {
    verifyStudentId: async (_, { imageUrl }, { user }) => {
      if (!user) throw new Error('Not authenticated');

      // Parse student info from image using regex patterns
      const studentInfo = {
        studentId: null,
        name: null,
        department: null,
        university: null,
        year: null
      };

      // In production, use Tesseract OCR. For now, simulate extraction
      const mockExtracted = process.env.MOCK_OCR === 'true';

      if (mockExtracted) {
        const success = Math.random() < parseFloat(process.env.MOCK_OCR_SUCCESS_RATE || '0.9');
        if (success) {
          studentInfo.studentId = `STU${Math.floor(100000 + Math.random() * 900000)}`;
          studentInfo.university = 'Sample University';
          studentInfo.department = 'Computer Science';
        }
      } else {
        try {
          const { ocrService } = require('../../services/ocr.service');
          const result = await ocrService.verifyStudentId(imageUrl);
          if (result.studentInfo) {
            Object.assign(studentInfo, result.studentInfo);
          }
        } catch (err) {
          console.error('OCR processing error:', err.message);
        }
      }

      const isValid = !!studentInfo.studentId;
      const status = isValid ? 'VERIFIED' : 'FAILED';

      // Store verification result
      await query(
        `INSERT INTO student_verifications (id, user_id, image_url, student_id_number, university, department, status, verified_at, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           image_url = $2, student_id_number = $3, university = $4, department = $5, status = $6, verified_at = $7`,
        [user.userId, imageUrl, studentInfo.studentId, studentInfo.university, studentInfo.department, status, isValid ? new Date().toISOString() : null]
      );

      // Update user role if verified
      if (isValid) {
        await query(`UPDATE users SET account_status = 'VERIFIED', updated_at = NOW() WHERE id = $1`, [user.userId]);
      }

      return {
        isValid,
        studentId: studentInfo.studentId,
        university: studentInfo.university,
        department: studentInfo.department,
        status,
        message: isValid ? 'Student ID verified successfully' : 'Could not verify student ID'
      };
    }
  }
};

module.exports = ocrResolvers;
