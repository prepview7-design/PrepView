import urllib.request, json
req = urllib.request.Request(
    'http://127.0.0.1:8000/run',
    data=json.dumps({'language': 'java', 'code': 'class Solution { public static void main(String[] args) { System.out.println("hello"); } }', 'stdin': '', 'timeout_seconds': 5.0}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
print(urllib.request.urlopen(req).read().decode('utf-8'))
