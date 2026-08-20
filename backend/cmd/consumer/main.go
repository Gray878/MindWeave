package main

import (
	"context"
)

func main() {
	app, cleanup, err := createApp()
	if err != nil {
		panic(err)
	}
	defer cleanup()
	
	if err := app.MQConsumer.StartConsumerHandlers(context.Background()); err != nil {
		panic(err)
	}
	if err := app.MQConsumer.Close(); err != nil {
		panic(err)
	}
}
