package server

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"go.admiral.io/admiral/cmd/assets"
	"go.admiral.io/admiral/internal/config"
	"go.admiral.io/admiral/internal/gateway"
)

type startCmd struct {
	Cmd *cobra.Command
}

func newStartCmd() *startCmd {
	root := &startCmd{}
	cmd := &cobra.Command{
		Use:     "start",
		Aliases: []string{"s", "serve", "run"},
		Short:   "Start the Admiral server process",
		Long:    "Start the Admiral server process with the specified configuration.",
		Example: `  # Start with default configuration
  admiral-server start

  # Start with custom config and debug mode
  admiral-server start --config /path/to/config.yaml --debug

  # Start with additional environment files
  admiral-server start --env .env.local --env .env.production`,
		Args:              cobra.NoArgs,
		ValidArgsFunction: cobra.NoFileCompletions,
		PreRunE: func(cmd *cobra.Command, args []string) error {
			if configFile == "" {
				return wrapErrorWithCode(
					fmt.Errorf("configuration file is required"),
					1,
					"missing configuration file",
				)
			}

			if _, err := os.Stat(configFile); os.IsNotExist(err) {
				return wrapErrorWithCode(
					err,
					1,
					fmt.Sprintf("configuration file does not exist: %s", configFile),
				)
			}

			return nil
		},
		Run: func(cmd *cobra.Command, args []string) {
			cfg := config.Build(configFile, envVarFiles, debug)
			gateway.Run(cfg, gateway.CoreComponentFactory, assets.VirtualFS)
		},
	}

	root.Cmd = cmd
	return root
}
