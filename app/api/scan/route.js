const WEBAPP_URL =
  process.env.APPS_SCRIPT_WEBAPP_URL ||
  'https://script.google.com/macros/s/AKfycbwFb0KLOBrLLJCnFzBDM241DCfBHzlGiItT62JuBziATet-3EJlbRfzF2YBhKNicdHU-A/exec';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json(
      { status: 'error', message: 'No student ID provided.' },
      { status: 400 }
    );
  }

  try {
    const url = `${WEBAPP_URL}?action=scan&id=${encodeURIComponent(id)}`;
    const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    const text = await response.text();

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return Response.json(
        {
          status: 'error',
          message: 'Proxy received a non-JSON response from Apps Script.',
        },
        { status: 502 }
      );
    }

    return Response.json(payload);
  } catch (err) {
    return Response.json(
      {
        status: 'error',
        message: `Proxy could not reach Apps Script: ${err.message}`,
      },
      { status: 500 }
    );
  }
}