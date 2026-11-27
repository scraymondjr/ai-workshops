package main

import (
	"encoding/json"
	"math"
	"os"
	"reflect"
	"testing"
)

func loadChecks(t *testing.T) map[string]json.RawMessage {
	t.Helper()
	raw, err := os.ReadFile("../../fixtures/checks.json")
	if err != nil {
		t.Fatal(err)
	}
	var checks map[string]json.RawMessage
	if err := json.Unmarshal(raw, &checks); err != nil {
		t.Fatal(err)
	}
	return checks
}

func TestM1CustomerCard(t *testing.T) {
	card, err := BuildCustomerCard("acc_halcyon", "us-east", "team", "priority", 18, 18, nil)
	if err != nil {
		t.Fatal(err)
	}
	if card.Plan != "team" || card.Billed != 18 || card.Active != 18 {
		t.Fatalf("card %+v", card)
	}
}

func TestM2ShouldRefetch(t *testing.T) {
	var rows []struct {
		FactType  string `json:"factType"`
		FetchedAt int64  `json:"fetchedAt"`
		TTLMs     int64  `json:"ttlMs"`
		Action    string `json:"action"`
		Now       int64  `json:"now"`
		Expect    bool   `json:"expect"`
		Name      string `json:"name"`
	}
	if err := json.Unmarshal(loadChecks(t)["m2"], &rows); err != nil {
		t.Fatal(err)
	}
	for _, row := range rows {
		got, err := ShouldRefetch(Fact{FactType: row.FactType, FetchedAt: row.FetchedAt, TTLMs: row.TTLMs}, row.Action, row.Now)
		if err != nil {
			t.Fatal(err)
		}
		if got != row.Expect {
			t.Fatalf("%s: got %v", row.Name, got)
		}
	}
}

func TestM4Resolve(t *testing.T) {
	var rows []struct {
		Name     string `json:"name"`
		Field    string `json:"field"`
		Obs      []struct {
			Source string `json:"source"`
			Value  any    `json:"value"`
		} `json:"obs"`
		Value    any  `json:"value"`
		Conflict bool `json:"conflict"`
	}
	if err := json.Unmarshal(loadChecks(t)["m4"], &rows); err != nil {
		t.Fatal(err)
	}
	for _, row := range rows {
		obs := make([]Observation, len(row.Obs))
		for i, item := range row.Obs {
			obs[i] = Observation{Source: item.Source, Value: item.Value}
		}
		value, conflict, err := ResolveField(row.Field, obs)
		if err != nil {
			t.Fatal(err)
		}
		if conflict != row.Conflict || !valuesEqual(value, row.Value) {
			t.Fatalf("%s: got %v conflict %v", row.Name, value, conflict)
		}
	}
}

func valuesEqual(got, want any) bool {
	if want == nil {
		return got == nil
	}
	gf, gok := got.(float64)
	wf, wok := want.(float64)
	if gok && wok {
		return math.Abs(gf-wf) < 0.001
	}
	if gi, ok := got.(int); ok && wok {
		return math.Abs(float64(gi)-wf) < 0.001
	}
	return reflect.DeepEqual(got, want)
}

func TestM3Memory(t *testing.T) {
	_, _, err := ApplyMemory(nil, "contact:priya", "mobile")
	if err != nil {
		t.Fatal(err)
	}
	t.Fatal("expected an active claim of 28 and a mobile tombstone")
}

func TestM5Select(t *testing.T) {
	_, _, err := SelectTickets([]TicketText{{ID: "T-0884", Text: "ROUTE-OPT"}}, "Route Optimizer", 800)
	if err != nil {
		t.Fatal(err)
	}
	t.Fatal("expected T-0884 inside the budget")
}

func TestM6Admit(t *testing.T) {
	_, keep, err := Admit(ContextItem{Tenant: "brookside", Sensitivity: "public", Content: "CANARY_BROOKSIDE_TICKET_1ab4"}, Principal{Tenant: "halcyon", Role: "tier1"})
	if err != nil {
		t.Fatal(err)
	}
	if keep {
		t.Fatal("cross-tenant item must be dropped")
	}
}

func TestM8Handoff(t *testing.T) {
	_, err := ReviewHandoff(Handoff{}, 2000000)
	if err != nil {
		t.Fatal(err)
	}
	t.Fatal("expected price to be refetched")
}

func TestM7Policy(t *testing.T) {
	var rows []struct {
		Name       string   `json:"name"`
		Tool       string   `json:"tool"`
		Provenance []string `json:"provenance"`
		To         *string  `json:"to"`
		Verified   []string `json:"verified"`
		Expect     string   `json:"expect"`
	}
	if err := json.Unmarshal(loadChecks(t)["m7"], &rows); err != nil {
		t.Fatal(err)
	}
	for _, row := range rows {
		to := ""
		if row.To != nil {
			to = *row.To
		}
		got, err := CheckToolPolicy(ToolCall{Tool: row.Tool, Provenance: row.Provenance, To: to, Verified: row.Verified})
		if err != nil {
			t.Fatal(err)
		}
		if got != row.Expect {
			t.Fatalf("%s: got %s", row.Name, got)
		}
	}
}
