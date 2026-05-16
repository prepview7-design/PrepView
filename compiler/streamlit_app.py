import streamlit as st
import requests

# Set page config
st.set_page_config(page_title="Online Compiler", layout="wide")

st.title("Online Code Compiler")

# API Endpoint
BACKEND_URL = "http://127.0.0.1:8000/run"

EXAMPLES = {
    "python": 'name = input() or "Python"\nprint(f"Hello, {name}!")',
    "c": '#include <stdio.h>\nint main() {\n  char name[80];\n  if (scanf("%79s", name) != 1) return 0;\n  printf("Hello, %s!\\n", name);\n  return 0;\n}',
    "cpp": '#include <iostream>\n#include <string>\nint main() {\n  std::string name;\n  std::cin >> name;\n  std::cout << "Hello, " << name << "!\\n";\n}',
    "java": 'public class Main {\n  public static void main(String[] args) throws Exception {\n    java.util.Scanner sc = new java.util.Scanner(System.in);\n    String name = sc.hasNext() ? sc.next() : "Java";\n    System.out.println("Hello, " + name + "!");\n  }\n}'
}

# Language selection
language = st.selectbox("Select Language", options=["python", "c", "cpp", "java"])

# Default code based on selection
if "current_language" not in st.session_state or st.session_state.current_language != language:
    st.session_state.code = EXAMPLES[language]
    st.session_state.current_language = language

col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Source Code")
    code = st.text_area("Code", value=st.session_state.code, height=400, label_visibility="collapsed")
    st.session_state.code = code

with col2:
    st.subheader("Standard Input")
    stdin = st.text_area("Input (stdin)", height=150, label_visibility="collapsed")

    run_button = st.button("Run Code", type="primary", use_container_width=True)

st.divider()

if run_button:
    with st.spinner("Running code..."):
        try:
            response = requests.post(
                BACKEND_URL,
                json={"language": language, "code": code, "stdin": stdin, "timeout_seconds": 5.0},
            )
            if response.status_code == 200:
                data = response.json()
                
                # Display Results
                st.subheader("Execution Result")
                st.write(f"**Status:** `{data.get('status')}` | **Exit Code:** `{data.get('exit_code')}` | **Duration:** `{data.get('duration_ms')} ms`")
                
                if data.get("compile_stderr"):
                    st.error("Compilation Error")
                    st.code(data.get("compile_stderr"))
                
                if data.get("stdout"):
                    st.success("Standard Output")
                    st.code(data.get("stdout"))
                else:
                    st.info("No standard output.")
                
                if data.get("stderr"):
                    st.warning("Standard Error")
                    st.code(data.get("stderr"))
            else:
                st.error(f"Backend Error: {response.status_code}")
                st.write(response.text)
        except requests.exceptions.RequestException as e:
            st.error(f"Failed to connect to backend: {e}")
