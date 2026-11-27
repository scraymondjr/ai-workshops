package main

import (
	"bytes"
	"encoding/json"
	"os/exec"
	"testing"
)

func TestEchoReply(t *testing.T) {
	reply := EchoReply(Turn{Type: "turn", Text: "hello"})
	if reply.Answer != "hello" || reply.Handoff != nil {
		t.Fatalf("unexpected reply %+v", reply)
	}
}

func TestStdio(t *testing.T) {
	cmd := exec.Command("go", "run", ".")
	cmd.Stdin = bytes.NewBufferString("{\"type\":\"turn\",\"text\":\"hello\"}\n")
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("go run: %v\n%s", err, out)
	}
	var reply Reply
	if err := json.Unmarshal(bytes.Split(out, []byte("\n"))[0], &reply); err != nil {
		t.Fatal(err)
	}
	if reply.Answer != "hello" {
		t.Fatalf("answer %q", reply.Answer)
	}
}
