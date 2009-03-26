require 'WebHandler'


module WebHandlerFactory
  def create_handler
    return WebHandler.new
  end
end