package main

import "errors"

// ErrNotImplemented marks a starter exercise. The message is part of the CI check.
var ErrNotImplemented = errors.New("LEARNER_TODO")

type CustomerCard struct {
	AccountID string
	Plan      string
	Billed    int
	Active    int
	AddOns    []string
	SLATier   string
	Region    string
}

type Fact struct {
	FactType  string
	FetchedAt int64
	TTLMs     int64
}

type MemoryRecord struct {
	ID         string
	Tenant     string
	Subject    string
	Claim      string
	ClaimType  string
	SourceTurn string
	Supersedes string
}

type Observation struct {
	Source string
	Value  any
}

type TicketText struct {
	ID   string
	Text string
}

type ContextItem struct {
	ID          string
	Tenant      string
	Sensitivity string
	Content     string
}

type Principal struct {
	Tenant string
	Role   string
}

type ToolCall struct {
	Tool       string
	Provenance []string
	To         string
	Verified   []string
}

type HandoffFact struct {
	Key       string
	FetchedAt int64
	TTLMs     int64
}

type Handoff struct {
	Facts          []HandoffFact
	UntrustedSpans []string
	Summary        string
}

type HandoffReview struct {
	Refetch           []string
	Keep              []string
	CarriesUntrusted  bool
	SummaryTokens     int
}

func BuildCustomerCard(accountID, region, billingPlan, sla string, billed, active int, addOns []string) (CustomerCard, error) {
	return CustomerCard{}, errors.New("LEARNER_TODO: implement BuildCustomerCard")
}

func ShouldRefetch(f Fact, action string, now int64) (bool, error) {
	return false, errors.New("LEARNER_TODO: implement ShouldRefetch")
}

func ApplyMemory(writes []MemoryRecord, forgetSubject, forgetType string) (active []MemoryRecord, tombstones []string, err error) {
	return nil, nil, errors.New("LEARNER_TODO: implement ApplyMemory")
}

func ResolveField(field string, obs []Observation) (value any, conflict bool, err error) {
	return nil, false, errors.New("LEARNER_TODO: implement ResolveField")
}

func SelectTickets(tickets []TicketText, query string, budget int) (verbatim []TicketText, tokens int, err error) {
	return nil, 0, errors.New("LEARNER_TODO: implement SelectTickets")
}

func Admit(item ContextItem, who Principal) (ContextItem, bool, error) {
	return ContextItem{}, false, errors.New("LEARNER_TODO: implement Admit")
}

func CheckToolPolicy(call ToolCall) (string, error) {
	return "", errors.New("LEARNER_TODO: implement CheckToolPolicy")
}

func ReviewHandoff(packet Handoff, now int64) (HandoffReview, error) {
	return HandoffReview{}, errors.New("LEARNER_TODO: implement ReviewHandoff")
}
