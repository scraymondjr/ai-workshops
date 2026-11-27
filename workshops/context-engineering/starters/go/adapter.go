package main

import (
	"bufio"
	"encoding/json"
	"os"
)

type Turn struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

type Reply struct {
	Answer          string `json:"answer"`
	ContextSnapshot []any  `json:"contextSnapshot"`
	Handoff         any    `json:"handoff"`
}

func EchoReply(turn Turn) Reply {
	answer := turn.Text
	if turn.Type == "newSession" {
		answer = ""
	}
	return Reply{Answer: answer, ContextSnapshot: []any{}, Handoff: nil}
}

func RunStdio() {
	scanner := bufio.NewScanner(os.Stdin)
	encoder := json.NewEncoder(os.Stdout)
	for scanner.Scan() {
		var turn Turn
		if err := json.Unmarshal(scanner.Bytes(), &turn); err != nil {
			continue
		}
		_ = encoder.Encode(EchoReply(turn))
	}
}
