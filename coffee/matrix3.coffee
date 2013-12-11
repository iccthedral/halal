"use strict"

define ["mathutil"], 

(MathUtil) ->
    
    Matrix3 = {}

    Matrix3.create = () ->
        out = new MathUtil.ARRAY_TYPE(9)
        out[0] = 1
        out[1] = 0
        out[2] = 0
        out[3] = 0
        out[4] = 1
        out[5] = 0
        out[6] = 0
        out[7] = 0
        out[8] = 1
        return out

    Matrix3.inverse = (out, a) ->
        # a[0] a[1] a[2]
        # a[3] a[4] a[5]
        # a[6] a[7] a[8]

# Transform::Transform(float a00, float a01, float a02,
#                      float a10, float a11, float a12,
#                      float a20, float a21, float a22)
# {
#     m_matrix[0] = a00; m_matrix[4] = a01; m_matrix[8]  = 0.f; m_matrix[12] = a02;
#     m_matrix[1] = a10; m_matrix[5] = a11; m_matrix[9]  = 0.f; m_matrix[13] = a12;
#     m_matrix[2] = 0.f; m_matrix[6] = 0.f; m_matrix[10] = 1.f; m_matrix[14] = 0.f;
#     m_matrix[3] = a20; m_matrix[7] = a21; m_matrix[11] = 0.f; m_matrix[15] = a22;

    # float det = m_matrix[0] * (m_matrix[15] * m_matrix[5] - m_matrix[7] * m_matrix[13]) -
    #             m_matrix[1] * (m_matrix[15] * m_matrix[4] - m_matrix[7] * m_matrix[12]) +
    #             m_matrix[3] * (m_matrix[13] * m_matrix[4] - m_matrix[5] * m_matrix[12]);
    # if (det != 0.f)
    # {
    #     return Transform( (m_matrix[15] * m_matrix[5] - m_matrix[7] * m_matrix[13]) / det,
    #                      -(m_matrix[15] * m_matrix[4] - m_matrix[7] * m_matrix[12]) / det,
    #                       (m_matrix[13] * m_matrix[4] - m_matrix[5] * m_matrix[12]) / det,
    #                      -(m_matrix[15] * m_matrix[1] - m_matrix[3] * m_matrix[13]) / det,
    #                       (m_matrix[15] * m_matrix[0] - m_matrix[3] * m_matrix[12]) / det,
    #                      -(m_matrix[13] * m_matrix[0] - m_matrix[1] * m_matrix[12]) / det,
    #                       (m_matrix[7]  * m_matrix[1] - m_matrix[3] * m_matrix[5])  / det,
    #                      -(m_matrix[7]  * m_matrix[0] - m_matrix[3] * m_matrix[4])  / det,
    #                       (m_matrix[5]  * m_matrix[0] - m_matrix[1] * m_matrix[4])  / det);
    # }
    # else
    # {
    #     return Identity;
    # }

        a00 = a[0]
        a01 = a[1]
        a02 = a[2]

        a10 = a[3]
        a11 = a[4]
        a12 = a[5]
        
        a20 = a[6]
        a21 = a[7] 
        a22 = a[8]

        b01 = a22 * a11 - a12 * a21
        b11 = -a22 * a10 + a12 * a20
        b21 = a21 * a10 - a11 * a20

        det = a00 * b01 + a01 * b11 + a02 * b21

        if not det
            return null
        det = 1.0 / det

        out[0] = b01 * det
        out[1] = (-a22 * a01 + a02 * a21) * det
        out[2] = (a12 * a01 - a02 * a11) * det
        out[3] = b11 * det
        out[4] = (a22 * a00 - a02 * a20) * det
        out[5] = (-a12 * a00 + a02 * a10) * det
        out[6] = b21 * det
        out[7] = (-a21 * a00 + a01 * a20) * det
        out[8] = (a11 * a00 - a01 * a10) * det

        return out

    Matrix3.translate = (x, y) ->
        out = new MathUtil.ARRAY_TYPE(9)
        out[0] = 1
        out[1] = 0
        out[2] = x
        out[3] = 0
        out[4] = 1
        out[5] = y
        out[6] = 0
        out[7] = 0
        out[8] = 1
        return out

    Matrix3.scale = (out, scaleX = 1, scaleY = 1) ->
        #out = new MathUtil.ARRAY_TYPE(9)
        out[0] = scaleX
        out[1] = 0
        out[2] = 0
        out[3] = 0
        out[4] = scaleY
        out[5] = 0
        out[6] = 0
        out[7] = 0
        out[8] = 1
        return out 

    Matrix3.rotate = (angle) ->
        out = new MathUtil.ARRAY_TYPE(9)
        out[0] = Math.cos(angle)
        out[1] = -Math.sin(angle)
        out[2] = 0
        out[3] = Math.sin(angle)
        out[4] = Math.cos(angle)
        out[5] = 0
        out[6] = 0
        out[7] = 0
        out[8] = 1
        return out

    Matrix3.transpose = (out, a) ->
        if out is a
            a01 = a[1]
            a02 = a[2]
            a12 = a[5]
            out[1] = a[3]
            out[2] = a[6]
            out[3] = a01
            out[5] = a[7]
            out[6] = a02
            out[7] = a12
        else
            out[0] = a[0]
            out[1] = a[3]
            out[2] = a[6]
            out[3] = a[1]
            out[4] = a[4]
            out[5] = a[7]
            out[6] = a[2]
            out[7] = a[5]
            out[8] = a[8]
        return out

    Matrix3.clone = (a) ->
        out = new MathUtil.ARRAY_TYPE(9)

        out[0] = a[0]
        out[1] = a[1]
        out[2] = a[2]
        out[3] = a[3]
        out[4] = a[4]
        out[5] = a[5]
        out[6] = a[6]
        out[7] = a[7]
        out[8] = a[8]
        return out

    Matrix3.copy = (a) ->
        out[0] = a[0]
        out[1] = a[1]
        out[2] = a[2]
        out[3] = a[3]
        out[4] = a[4]
        out[5] = a[5]
        out[6] = a[6]
        out[7] = a[7]
        out[8] = a[8]
        return out

    Matrix3.identity = (out) ->
        out[0] = 1
        out[1] = 0
        out[2] = 0
        out[3] = 0
        out[4] = 1
        out[5] = 0
        out[6] = 0
        out[7] = 0
        out[8] = 1
        return out


    Matrix3.mul = (out, a, b) ->
        # out = new MathUtil.ARRAY_TYPE(9)
        out = []
        a00 = a[0]
        a01 = a[1]
        a02 = a[2]
        a10 = a[3]
        a11 = a[4]
        a12 = a[5]
        a20 = a[6]
        a21 = a[7]
        a22 = a[8]

        b00 = b[0]
        b01 = b[1]
        b02 = b[2]
        b10 = b[3]
        b11 = b[4]
        b12 = b[5]
        b20 = b[6]
        b21 = b[7]
        b22 = b[8]

        out[0] = b00 * a00 + b01 * a10 + b02 * a20
        out[1] = b00 * a01 + b01 * a11 + b02 * a21
        out[2] = b00 * a02 + b01 * a12 + b02 * a22

        out[3] = b10 * a00 + b11 * a10 + b12 * a20
        out[4] = b10 * a01 + b11 * a11 + b12 * a21
        out[5] = b10 * a02 + b11 * a12 + b12 * a22

        out[6] = b20 * a00 + b21 * a10 + b22 * a20
        out[7] = b20 * a01 + b21 * a11 + b22 * a21
        out[8] = b20 * a02 + b21 * a12 + b22 * a22
        return out

    return Matrix3
    