export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * Robust fetch wrapper that guarantees safe JSON handling and readable Arabic error messages.
 * Prevents "Unexpected token 'T', 'The page c'... is not valid JSON" errors.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    let json: any = null;

    if (contentType.includes('application/json')) {
      try {
        json = await res.json();
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      const errorMsg =
        json?.error ||
        (res.status === 401
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
          : res.status === 404
          ? 'المورد المطلوب غير موجود'
          : `خطأ في الخادم (${res.status})`);

      return {
        ok: false,
        status: res.status,
        data: json,
        error: errorMsg
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'تعذر الاتصال بالخادم، يرجى التأكد من تشغيل الخادم وتحديث الصفحة.'
    };
  }
}
